import mongoose from "mongoose";

const AuthSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // should be hashed
    address: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "other", required: true },
    caste: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "pending", required: true },
    mobileNumber: { type: String, required: true, minlength: 10, maxlength: 10 },
    dob: { type: Date, required: true },
    age: { type: Number, required: true, default: 3 },
    biodata: { type: String, trim: true, default: "" },
    short_desc: { type: String, trim: true, default: "" },
    resume: { type: String, trim: true, default: "" },
    profile_photo: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const Auth = mongoose.model("Auth", AuthSchema);

export default Auth;
