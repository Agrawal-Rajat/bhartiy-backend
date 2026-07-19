import Auth from "../../models/AuthModel/auth.model.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const loginController = async (req, res) => {
  console.log('In login Controller')
  try {
    const { emailOrMobile, password } = req.body;
    // console.log(req.body)
    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ Find user by username (single object return karega)
    var user = await Auth.findOne({ email: emailOrMobile });
    console.log(user)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this username",
      });
    }

    // ✅ Compare entered password with hashed password
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // ✅ Check JWT secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).send({
        message: "JWT secret is not set in the environment variables",
        success: false,
      });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        age: user?.age,
        gender: user?.gender
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    // console.log(token)

    // ✅ Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production", // works in dev & prod
      secure: true,
      sameSite: "None", // allow cross-site cookies
      // secure: false,
      // sameSite: "lax", // CSRF protection
      maxAge: 86400000, // 1 day
    });

    // ✅ Send success response
    res.status(200).json({
      message: "Successfully logged in",
      success: true,
      user: {
        username: user.username,
        email: user.email,
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
    const user = await Auth.findById(id).select("-password");
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

}

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
