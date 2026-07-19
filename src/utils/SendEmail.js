// controllers/AuthController.js
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Auth from "../models/AuthModel/auth.model.js";
import { google } from "googleapis";

dotenv.config();

// ✅ Setup OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,      // From Google Cloud
  process.env.CLIENT_SECRET,  // From Google Cloud
  "https://developers.google.com/oauthplayground" // Redirect URI
);

// ✅ Refresh Token from Playground (optional)
if (process.env.REFRESH_TOKEN) {
  oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });
}

// ✅ Function to create transporter with OAuth2 fallback
async function createTransporter() {
  try {
    if (process.env.REFRESH_TOKEN) {
      // 🔹 Try OAuth2 first
      const accessToken = await oAuth2Client.getAccessToken();

      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_USER,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.REFRESH_TOKEN,
          accessToken: accessToken?.token,
        },
      });
    } else {
      throw new Error("No refresh token, falling back to App Password");
    }
  } catch (error) {
    console.warn("⚠️ OAuth2 failed, falling back to App Password mode:", error.message);

    // 🔹 Use App Password fallback
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password (not Gmail login password!)
      },
    });
  }
}

// ✅ Helper: Convert number & token into query string
function numberToTokenQuery(token, number) {
  const chars = number.toString().split("");
  const tokenParts = chars.map((digit, index) => `d${index}=${digit}`);
  return `?token=${encodeURIComponent(token)}&` + tokenParts.join("&");
}

// ✅ Controller function
export const SendEmail = async (req, res) => {
  try {
    const { Email, subject, description, link } = req.body;

    // ✅ Fetch user from MongoDB
    const user = await Auth.findOne({ email: Email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const tokentosend = numberToTokenQuery(token, user._id);

    // ✅ Set token cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 3600000, // 1h
    });

    // ✅ Create transporter (OAuth2 → App Password fallback)
    const transporter = await createTransporter();

    // ✅ Send email
    const info = await transporter.sendMail({
      from: `"MII [Medicaps Innovation And Incubation] Foundation" <${process.env.EMAIL_USER}>`,
      to: Email,
      subject,
      text: description,
      html: `<b>${link + tokentosend}</b>`,
    });

    return res.status(200).json({ message: "Email sent successfully", info });
  } catch (error) {
    console.error("Error in sendEmail:", error);
    return res.status(500).json({ message: "Email not sent", error: error.message });
  }
};
