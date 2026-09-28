import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Auth from "../models/AuthModel/auth.model.js";

dotenv.config();

// Function to create transporter (Brevo SMTP preferred for Render, with Gmail fallback)
function createTransporter() {
  const brevoUser =
    process.env.BREVO_SMTP_USER ||
    process.env.BREVO_LOGIN ||
    "bb6c13001@smtp-brevo.com";
  const brevoKey =
    process.env.BREVO_SMTP_KEY ||
    process.env.BREVO_PASSWORD ||
    process.env.EMAIL_PASS;
  const brevoHost = process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com";
  const brevoPort = parseInt(process.env.BREVO_SMTP_PORT || "587", 10);

  // If Brevo SMTP is configured
  if (brevoKey && !brevoKey.includes("your_gmail") && !brevoKey.includes("your_brevo")) {
    return nodemailer.createTransport({
      host: brevoHost,
      port: brevoPort,
      secure: false, // port 587 uses STARTTLS
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  // Fallback to standard Gmail SMTP
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function numberToTokenQuery(token, number) {
  const chars = number.toString().split("");
  const tokenParts = chars.map((digit, index) => `d${index}=${digit}`);
  return `?token=${encodeURIComponent(token)}&` + tokenParts.join("&");
}

export const SendEmail = async (req, res) => {
  try {
    const { Email, subject, description, link } = req.body;

    const user = await Auth.findOne({ email: Email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const tokentosend = numberToTokenQuery(token, user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 3600000,
    });

    const transporter = createTransporter();

    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ||
      process.env.SENDER_EMAIL ||
      process.env.EMAIL_USER ||
      "contact@bhartiy.in";
    const senderName = process.env.SENDER_NAME || "BhartIY";

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
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
