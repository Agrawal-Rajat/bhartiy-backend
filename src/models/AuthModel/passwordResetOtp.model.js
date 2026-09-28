import mongoose from "mongoose";

const PasswordResetOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      default: null,
      index: true,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // MongoDB TTL index: 15 minutes
    },
  },
  { timestamps: true }
);

const PasswordResetOtp = mongoose.model(
  "PasswordResetOtp",
  PasswordResetOtpSchema
);

export default PasswordResetOtp;
