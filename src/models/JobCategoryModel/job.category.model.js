import mongoose from "mongoose";

const JobCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true,  trim: true },
  },
  { timestamps: true }
);

const JobCategory = mongoose.model("job_category", JobCategorySchema);

export default JobCategory;
