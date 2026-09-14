import mongoose from "mongoose";

const MatrimonyCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const MatrimonyCategory = mongoose.model("matrimony_category", MatrimonyCategorySchema);

export default MatrimonyCategory;
