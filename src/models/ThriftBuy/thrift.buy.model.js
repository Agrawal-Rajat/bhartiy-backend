import mongoose from "mongoose";

const ThriftBuySchema = new mongoose.Schema(
  {
    //profile_id
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
     //intrested_person_id
    ThriftProductID: { type: mongoose.Schema.Types.ObjectId, ref: 'thrift', required: true },
    status: { type: String, enum: ['approved', 'pending','rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const ThriftBuyApplies = mongoose.model("ThriftBuy_applies", ThriftBuySchema);

export default ThriftBuyApplies;
