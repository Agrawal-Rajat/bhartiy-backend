import jwt from "jsonwebtoken";
import Auth from "../models/AuthModel/auth.model.js";
import dotenv from "dotenv";
import Admin from "../models/AuthModel/admin.model.js";
dotenv.config();

const verify = async (req, res) => {
  try {
    // 1. Get token from cookies or Authorization header
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      } else if (parts.length === 1) {
        token = parts[0];
      }
    }
    if (!token && req.headers?.["x-access-token"]) {
      token = req.headers["x-access-token"];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token found, please login" });
    }

    // 2. Verify token and extract payload
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    const { email, role } = decoded; // email & role stored in token
    console.log("Decoded token:", decoded);

    const cleanEmail = email ? email.trim().toLowerCase() : "";
    let user = null;

    // 3. If role is admin or subadmin, check Admin model first
    if (role === "admin" || role === "subadmin" || role === "superadmin") {
      user = await Admin.findOne({
        $or: [
          { email: cleanEmail },
          { email: email },
          { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } }
        ]
      });
    }

    // Otherwise or if not found, check Auth model
    if (!user) {
      user = await Auth.findOne({
        $or: [
          { email: cleanEmail },
          { email: email },
          { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } }
        ]
      });
    }

    // Fallback check Admin model if not yet found
    if (!user) {
      user = await Admin.findOne({
        $or: [
          { email: cleanEmail },
          { email: email },
          { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.status && user.status === "inactive") {
      return res.status(403).json({ success: false, message: "Account is inactive" });
    }

    console.log("✅ User verified successfully");

    // 4. Send response with user data
    res.status(200).json({
      success: true,
      message: "User verified successfully",
      data: {
        ...decoded,
        username: user.username,
        role: user.role || decoded.role || "admin",
        permissions: user.permissions || decoded.permissions || ["matrimony", "matrimony_category"],
      },
    });

  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({ success: false, message: "Error verifying user", error: error.message || error });
  }
};

export { verify };
