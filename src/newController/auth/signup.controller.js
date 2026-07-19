
import Auth from "../../models/AuthModel/auth.model.js";
import bcrypt from "bcryptjs";

export const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
    return null;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const SignUpController = async (req, res) => {
  try {
    const { email, password, address, name, gender, dob, mobile } = req.body;

    if (!email || !password || !address || !name || !gender || !dob || !mobile) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const age = calculateAge(dob);

    if (age === null) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date of birth",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await Auth.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Auth.create({
      email: normalizedEmail,
      password: hashedPassword,
      mobileNumber: mobile,
      gender,
      dob,
      address,
      username: name,
      age,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export { SignUpController };
