import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },


        company: {
            type: String,
            required: true,
            trim: true,
        },

        location: {
            type: String,
            required: true,
            trim: true,
        },

        mode: {
            type: String,
            enum: ["Online", "Offline", "Hybrid"],
            required: true,
        },

        stipend: {
            type: Number,
            default: 0,
            min: 0,
        },

        duration: {
            type: String,
            required: true,
            trim: true,
        },

        openings: {
            type: Number,
            required: true,
            min: 1,
        },

        eligibility: {
            type: String,
            trim: true,
            default: "",
        },

        skills: [
            {
                type: String,
                trim: true,
            },
        ],

        lastDateToApply: {
            type: Date,
        },

        poster: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["Active", "Closed"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Training", trainingSchema);