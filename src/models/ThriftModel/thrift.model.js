import mongoose from "mongoose";

const ThriftSchema = new mongoose.Schema(
  {
    title: { type: String, required: true,  trim: true },
    description: { type: String, required: true,  trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'thrift_category', required: true },
    amount: { type: Number, required: true },
    seller: { type: String, required: true,  trim: true },
    poster: { type: String, required: true,  trim: true },
    status: { type: String, enum: ['approved', 'pending','rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const Thrift = mongoose.model("thrift", ThriftSchema);

export default Thrift;
