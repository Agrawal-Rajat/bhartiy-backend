import mongoose from "mongoose";

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true,  trim: true },
    description: { type: String, required: true,  trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'job_category', required: true },
    location: { type: String, required: true,  trim: true },
    salary: { type: Number, required: true },
    vacancies: { type: Number, required: true },
    company: { type: String, required: true,  trim: true },
    poster: { type: String, required: true,  trim: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

const Job = mongoose.model("job", JobSchema);

export default Job;
