import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true,  trim: true },
    description: { type: String, required: true,  trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'property_category', required: true },
    location: { type: String, required: true,  trim: true },
    amount: { type: String, required: true },
    seller: { type: String, required: true,  trim: true },
    poster: { type: String, required: true,  trim: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

const Property = mongoose.model("property", PropertySchema);

export default Property;
