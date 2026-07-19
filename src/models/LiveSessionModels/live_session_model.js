import mongoose from "mongoose";

const LiveSessionsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    link: { type: String, required: true },
    role: { type: String, enum: ['hanumanchalisa', 'khatushyam'], default: 'khatushyam' },
  },
  { timestamps: true }
);

const LiveSessions = mongoose.model("live_sessions", LiveSessionsSchema);

export default LiveSessions;
