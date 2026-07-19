import Admin from "../../models/AuthModel/admin.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const createAdmin = async () => {
  try {
    const email = "admin@bhartiy.in";
    const password = "Admin@123";

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username: "Admin",
      email,
      password: hashedPassword,
    });

    console.log("Admin created successfully:", admin.email);
  } catch (error) {
    console.error("Error creating admin:", error);
  }
}

const AdminloginController = async (req, res) => {
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
    var user = await Admin.findOne({ email: emailOrMobile });
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
export { AdminloginController, createAdmin };
