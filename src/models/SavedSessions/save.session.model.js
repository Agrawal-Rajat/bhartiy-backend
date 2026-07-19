import mongoose from "mongoose";

const SaveLiveSessionsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, required: true,unique:true },
    role: { type: String, enum: ['hanumanchalisa', 'khatushyam',"khatushyamsaved"], default: 'khatushyam' },
  },
  { timestamps: true }
);

const SaveLiveSessions = mongoose.model("save_live_sessions", SaveLiveSessionsSchema);

export default SaveLiveSessions;
