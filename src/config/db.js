import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDb=async ()=>{

    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MonogoDB is connected");

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
    }catch(error){
        console.log("Connection failed in MonogoDB :---- ",error)
    }

}

export default connectDb;