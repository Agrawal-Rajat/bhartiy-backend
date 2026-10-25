import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const FALLBACK_MONGO_URL =
  "mongodb://bhartiy:bhartiy2026@ac-v6b40xb-shard-00-00.ydhzdfw.mongodb.net:27017,ac-v6b40xb-shard-00-01.ydhzdfw.mongodb.net:27017,ac-v6b40xb-shard-00-02.ydhzdfw.mongodb.net:27017/?ssl=true&authSource=admin";

const connectDb = async () => {
  try {
    try {
      await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 });
      console.log("MongoDB is connected");
    } catch (srvErr) {
      if (srvErr.message && srvErr.message.includes("querySrv")) {
        console.warn("SRV DNS lookup failed (querySrv EBADRESP). Connecting via fallback replica-set URI...");
        await mongoose.connect(FALLBACK_MONGO_URL);
        console.log("MongoDB is connected (fallback URI)");
      } else {
        throw srvErr;
      }
    }

    try {
      const coll = mongoose.connection.collection("auths");
      const indexes = await coll.indexes();
      const emailIndex = indexes.find((i) => i.name === "email_1");
      if (emailIndex && !emailIndex.sparse && !emailIndex.partialFilterExpression) {
        await coll.dropIndex("email_1");
        await coll.createIndex(
          { email: 1 },
          { unique: true, partialFilterExpression: { email: { $type: "string", $gt: "" } } }
        );
      }
    } catch (indexErr) {
      console.error("Index sync notice:", indexErr.message);
    }

    return "connected";
  } catch (error) {
    console.log("Connection failed in MongoDB :---- ", error);
  }
};

export default connectDb;