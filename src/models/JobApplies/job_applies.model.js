import mongoose from "mongoose";

const JobAppliesSchema = new mongoose.Schema(
  {
    //profile_id
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
     //intrested_person_id
    JobID: { type: mongoose.Schema.Types.ObjectId, ref: 'job', required: true },
    status: { type: String, enum: ['approved', 'pending','rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const JobApplies = mongoose.model("job_applies", JobAppliesSchema);

export default JobApplies;
