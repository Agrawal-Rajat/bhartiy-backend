import mongoose from "mongoose";

const PropertyBuyerSchema = new mongoose.Schema(
  {
    //profile_id
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
     //intrested_person_id
    propertyID: { type: mongoose.Schema.Types.ObjectId, ref: 'property', required: true },
    status: { type: String, enum: ['approved', 'pending','rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const PropertyBuyer = mongoose.model("properties_applies", PropertyBuyerSchema);

export default PropertyBuyer;
