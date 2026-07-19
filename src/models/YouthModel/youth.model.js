import mongoose from "mongoose";

const YouthSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    poster: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Youth = mongoose.model("youth", YouthSchema);

export default Youth;
