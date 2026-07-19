import mongoose from "mongoose";

const PropertyCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true,  trim: true },
  },
  { timestamps: true }
);

const PropertyCategory = mongoose.model("property_category", PropertyCategorySchema);

export default PropertyCategory;
