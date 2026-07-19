import mongoose from "mongoose";

const ThriftCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true,  trim: true },
  },
  { timestamps: true }
);

const ThriftCategory = mongoose.model("thrift_category", ThriftCategorySchema);

export default ThriftCategory;
