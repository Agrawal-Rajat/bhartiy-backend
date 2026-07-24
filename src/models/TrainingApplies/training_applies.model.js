import mongoose from "mongoose";

const TrainingAppliesSchema = new mongoose.Schema(
    {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
        TrainingID: { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
        resume: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: ["approved", "pending", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true },
);

const TrainingApplies = mongoose.model("training_applies", TrainingAppliesSchema);

export default TrainingApplies;