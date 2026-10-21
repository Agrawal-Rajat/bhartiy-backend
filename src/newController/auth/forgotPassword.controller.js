import crypto from "crypto";
import bcrypt from "bcryptjs";
import Auth from "../../models/AuthModel/auth.model.js";
import PasswordResetOtp from "../../models/AuthModel/passwordResetOtp.model.js";
import { sendOtpEmail } from "../../utils/sendOtpEmail.js";

const normalizeEmail = (email) => {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const maskEmail = (str) => {
  if (!str || !str.includes("@")) return str;
  const [local, domain] = str.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local.slice(-1)}@${domain}`;
};

export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const rawInput = (req.body.email || req.body.identifier || req.body.username || "").trim();

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered email address or username.",
      });
    }

    const escapedInput = escapeRegex(rawInput);
    const user = await Auth.findOne({
      $or: [
        { email: rawInput.toLowerCase() },
        { email: rawInput },
        { email: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
        { username: rawInput },
        { username: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
        { mobileNumber: rawInput },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account found with this email or username.",
      });
    }

    const email = normalizeEmail(user.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "This account does not have a valid registered email address. Please contact support.",
      });
    }

    const existingOtp = await PasswordResetOtp.findOne({ email });
    if (existingOtp) {
      const timeSinceCreation = (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000;
      if (timeSinceCreation < 60) {
        const remainingSeconds = Math.ceil(60 - timeSinceCreation);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} second(s) before requesting another code.`,
          retryAfter: remainingSeconds,
        });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await PasswordResetOtp.deleteMany({ email });

    await PasswordResetOtp.create({
      email,
      userId: user._id,
      otpHash,
      attempts: 0,
      verified: false,
      createdAt: new Date(),
    });

    const emailResult = await sendOtpEmail({
      to: email,
      otp,
      username: user.name || (user.username && !user.username.startsWith("Candidate") ? user.username : "User"),
    });

    const masked = maskEmail(email);
    const responsePayload = {
      success: true,
      message: `A 6-digit verification code has been sent to your registered email (${masked}).`,
      email,
      maskedEmail: masked,
    };

    if (emailResult.isDevFallback && process.env.NODE_ENV !== "production") {
      responsePayload.devOtp = otp;
      responsePayload.devNotice = "OTP logged in backend console for development testing.";
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("sendForgotPasswordOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again later.",
      error: error.message,
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const rawInput = (req.body.email || req.body.identifier || req.body.username || "").trim();
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

    if (!rawInput || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email/username and 6-digit verification code are required.",
      });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be exactly 6 digits.",
      });
    }

    let email = normalizeEmail(rawInput);
    if (!isValidEmail(email)) {
      const escapedInput = escapeRegex(rawInput);
      const user = await Auth.findOne({
        $or: [
          { username: rawInput },
          { username: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
          { email: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
          { mobileNumber: rawInput },
        ],
      });
      if (user && user.email) {
        email = normalizeEmail(user.email);
      }
    }

    const resetDoc = await PasswordResetOtp.findOne({ email, verified: false });

    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or is invalid. Please request a new code.",
      });
    }

    if (resetDoc.attempts >= 5) {
      await PasswordResetOtp.deleteOne({ _id: resetDoc._id });
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new verification code for security.",
      });
    }

    const inputHash = crypto.createHash("sha256").update(otp).digest("hex");
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, "utf8"),
      Buffer.from(resetDoc.otpHash, "utf8")
    );

    if (!isMatch) {
      resetDoc.attempts += 1;
      await resetDoc.save();
      const remaining = 5 - resetDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    resetDoc.verified = true;
    resetDoc.resetToken = resetToken;
    resetDoc.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await resetDoc.save();

    return res.status(200).json({
      success: true,
      message: "Code verified successfully! You can now set a new password.",
      resetToken,
    });
  } catch (error) {
    console.error("verifyForgotPasswordOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
      error: error.message,
    });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const rawInput = (req.body.email || req.body.identifier || req.body.username || "").trim();
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!rawInput || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email/username, reset token, and new password are required.",
      });
    }

    let email = normalizeEmail(rawInput);
    if (!isValidEmail(email)) {
      const escapedInput = escapeRegex(rawInput);
      const user = await Auth.findOne({
        $or: [
          { username: rawInput },
          { username: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
          { email: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
          { mobileNumber: rawInput },
        ],
      });
      if (user && user.email) {
        email = normalizeEmail(user.email);
      }
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long.",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    const resetDoc = await PasswordResetOtp.findOne({
      email,
      resetToken,
      verified: true,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!resetDoc) {
      return res.status(400).json({
        success: false,
        message: "Password reset session has expired or is invalid. Please start the process again.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await Auth.findByIdAndUpdate(
      resetDoc.userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    await PasswordResetOtp.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "Your password has been successfully reset! You can now log in.",
    });
  } catch (error) {
    console.error("resetUserPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
      error: error.message,
    });
  }
};
