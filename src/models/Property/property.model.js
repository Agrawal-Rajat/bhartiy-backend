import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'property_category', default: null },
    location: { type: String, default: "", trim: true },
    amount: { type: String, default: "" },
    seller: { type: String, default: "", trim: true },
    poster: { type: String, default: "", trim: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

const Property = mongoose.model("property", PropertySchema);

export default Property;
