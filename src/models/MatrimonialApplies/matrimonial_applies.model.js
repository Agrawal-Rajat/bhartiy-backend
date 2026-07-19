import mongoose from "mongoose";

const MatrimonialAppliesSchema = new mongoose.Schema(
  {
    //profile_id
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
     //intrested_person_id
    intrestedID: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
    status: { type: String, enum: ['approved', 'pending','rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const MatrimonialApplies = mongoose.model("matrimonial_applies", MatrimonialAppliesSchema);

export default MatrimonialApplies;
