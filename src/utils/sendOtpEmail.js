import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Creates an SMTP transporter configured for Brevo (recommended for Render & cloud deployment)
 * with graceful fallback to Gmail if Brevo is not configured.
 */
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

  // Fallback to Gmail service if configured
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends a password reset OTP email with BhartIY branding.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.otp - 6-digit verification code
 * @param {string} [params.username] - User's name
 */
export async function sendOtpEmail({ to, otp, username = "Valued User" }) {
  const brevoKey =
    process.env.BREVO_SMTP_KEY ||
    process.env.BREVO_PASSWORD ||
    process.env.EMAIL_PASS;

  const isDummyConfig =
    !brevoKey ||
    brevoKey.includes("your_gmail") ||
    brevoKey.includes("your_brevo") ||
    brevoKey.length < 5;

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL ||
    process.env.SENDER_EMAIL ||
    process.env.EMAIL_USER ||
    "contact@bhartiy.in";
  const senderName = process.env.SENDER_NAME || "BhartIY";

  const emailSubject = "Bhartiy - Your Password Reset Verification Code";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fff7ed; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(234, 88, 12, 0.1); border: 1px solid #fed7aa; }
          .header { background: linear-gradient(135deg, #ea580c, #f97316); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 28px; color: #374151; }
          .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; }
          .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-label { font-size: 12px; font-weight: 700; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #c2410c; font-family: 'Courier New', Courier, monospace; }
          .timer-notice { font-size: 13px; color: #9a3412; font-weight: 500; margin-top: 10px; }
          .security-card { background: #f9fafb; border-left: 4px solid #f97316; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 24px; }
          .security-card p { margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5; }
          .footer { background: #fdfaf6; padding: 20px; text-align: center; border-top: 1px solid #ffedd5; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bhartiy</h1>
            <p>Empowering Community & Connection</p>
          </div>
          <div class="content">
            <div class="greeting">Namaste ${username},</div>
            <p class="message">
              We received a request to reset the password for your Bhartiy portal account. Use the verification code below to complete your password reset:
            </p>
            <div class="otp-box">
              <div class="otp-label">Your One-Time Password</div>
              <div class="otp-code">${otp}</div>
              <div class="timer-notice">⏳ This code will expire in <strong>10 minutes</strong>.</div>
            </div>
            <div class="security-card">
              <p>
                <strong>Security Alert:</strong> Never share this code with anyone. Bhartiy representatives will never ask for your OTP. If you did not make this request, you can safely ignore this email.
              </p>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Bhartiy. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const emailText = `Namaste ${username},\n\nYour password reset code for Bhartiy is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

  if (isDummyConfig) {
    console.log(`\n==================================================`);
    console.log(`🔑 [BREVO / DEV MODE] OTP for ${to}: ${otp}`);
    console.log(`(To send via Brevo, set BREVO_SMTP_KEY in .env)`);
    console.log(`==================================================\n`);
    return { success: true, isDevFallback: true };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });
    console.log(`✅ [Brevo SMTP] Password reset OTP email successfully sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send OTP email via Brevo SMTP:", error.message);
    // Log OTP in console so testing doesn't get blocked
    console.log(`\n==================================================`);
    console.log(`🔑 [FALLBACK OTP LOG] Recipient: ${to} | OTP: ${otp}`);
    console.log(`==================================================\n`);
    return { success: true, isDevFallback: true, error: error.message };
  }
}
