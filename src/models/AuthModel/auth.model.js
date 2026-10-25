import mongoose from "mongoose";

const AuthSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    username: { type: String, default: "Candidate Profile", trim: true },
    email: { type: String, default: null, trim: true },
    password: { type: String, default: "" }, // should be hashed
    address: { type: String, default: "" },
    city: { type: String, default: "", trim: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    caste: { type: String, trim: true, default: "" },
    bloodGroup: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "pending", required: true },
    mobileNumber: { type: String, default: "" },
    dob: { type: Date, default: null },
    age: { type: Number, default: 0 },
    biodata: { type: String, trim: true, default: "" },
    short_desc: { type: String, trim: true, default: "" },
    resume: { type: String, trim: true, default: "" },
    profile_photo: { type: String, trim: true, default: "" },
    category: { type: mongoose.Schema.Types.Mixed, default: null },
    isAllCategories: { type: Boolean, default: false },
    allowedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "matrimony_category" }],
    allowedViewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Auth" }],
    isAllViewers: { type: Boolean, default: true },
    isFirstLogin: { type: Boolean, default: true },
    loginCount: { type: Number, default: 0 },
    hasPendingChanges: { type: Boolean, default: false },
    pendingCategory: { type: mongoose.Schema.Types.Mixed, default: null },
    pendingIsAllCategories: { type: Boolean, default: false },
    pendingAllowedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "matrimony_category" }],
    pendingBiodata: { type: String, trim: true, default: "" },
    pendingChangeDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Auth = mongoose.model("Auth", AuthSchema);

export default Auth;
