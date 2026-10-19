import Auth from "../../models/AuthModel/auth.model.js";
import MatrimonyCategory from "../../models/MatrimonyCategoryModel/matrimony.category.model.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const loginController = async (req, res) => {
  console.log("In login Controller");
  try {
    const { identifier, emailOrMobile, email, username, password } = req.body;
    const loginInput = (identifier || emailOrMobile || email || username || "").trim();

    if (!loginInput || !password) {
      return res.status(400).json({
        success: false,
        message: "Username or email and password are required",
      });
    }

    const normalizedInput = loginInput.toLowerCase();
    const escapedInput = escapeRegex(loginInput);

    // Find user by email OR username (case-insensitive and trimmed), with mobile fallback
    const user = await Auth.findOne({
      $or: [
        { email: normalizedInput },
        { email: loginInput },
        { email: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
        { username: loginInput },
        { username: { $regex: new RegExp(`^${escapedInput}$`, "i") } },
        { mobileNumber: loginInput },
      ],
    });

    console.log("Found user for login:", user ? user.email : "none");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this username or email",
      });
    }

    // Compare entered password with hashed password
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).send({
        message: "JWT secret is not set in the environment variables",
        success: false,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email || "",
        username: user.username,
        age: user?.age,
        gender: user?.gender,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None", // allow cross-site cookies
      maxAge: 86400000, // 1 day
    });

    // Send success response
    res.status(200).json({
      message: "Successfully logged in",
      success: true,
      token: token,
      user: {
        username: user.username,
        name: user.name || user.username,
        email: user.email || "",
        auth_id: user._id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const GetUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Auth.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.category && user.category !== "All" && mongoose.Types.ObjectId.isValid(user.category)) {
      const categoryDoc = await MatrimonyCategory.findById(user.category).lean();
      if (categoryDoc) {
        user.categoryDetails = categoryDoc;
      }
    }

    res.status(200).json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user by ID",
      error: error.message || error
    });
  }
};

export const GetAllUsers = async (req, res) => {
  try {
    const users = await Auth.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching all users",
      error: error.message || error,
    });
  }
};

export const UpdateUserStatus = async (req, res) => {
  try {
    const { id, status } = req.body
    const user = await Auth.findByIdAndUpdate(id, { status: status }, { new: true })
    res.status(200).json({
      success: true,
      message: "User Status Updated",
      user: user
    });
  } catch (error) {
    console.error("Error updating user by status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user by ID",
      error: error.message || error
    });
  }

}
export { loginController };
