
import Auth from "../../models/AuthModel/auth.model.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { uploadToCloudinary } from "./update.controller.js";

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

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    const rawUsername = (req.params.username || "").trim();

    if (!rawUsername || rawUsername.length < 3) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Username must be at least 3 characters",
      });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(rawUsername)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Only letters, numbers, underscores (_), dots (.), and hyphens (-) are allowed without spaces",
      });
    }

    const escaped = escapeRegex(rawUsername);
    const existing = await Auth.findOne({
      username: { $regex: new RegExp(`^${escaped}$`, "i") },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Username is already taken",
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return res.status(500).json({
      success: false,
      available: false,
      message: "Error checking username availability",
    });
  }
};

const SignUpController = async (req, res) => {
  try {
    const {
      email,
      password,
      address,
      city,
      bloodGroup,
      name,
      username,
      gender,
      dob,
      mobile,
      caste,
      short_desc,
      category,
      allowedCategories,
    } = req.body;

    if (
      !password ||
      !address ||
      !city ||
      !bloodGroup ||
      !name ||
      !gender ||
      !dob ||
      !mobile
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const rawUsername = (username || "").trim();
    const rawEmail = (email || "").trim().toLowerCase();

    // At least one of username or email must be provided
    if (!rawUsername && !rawEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide either a username or an email address",
      });
    }

    let cleanUsername = "";
    let cleanEmail = null;

    // 1. Process username if provided, or generate a unique handle if only email was provided
    if (rawUsername) {
      if (rawUsername.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username must be at least 3 characters long",
        });
      }

      if (!/^[a-zA-Z0-9_.-]+$/.test(rawUsername)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can only contain letters, numbers, underscores (_), dots (.), and hyphens (-) without spaces",
        });
      }

      // Check if username is already taken (case-insensitive)
      const escaped = escapeRegex(rawUsername);
      const existingUserWithUsername = await Auth.findOne({
        username: { $regex: new RegExp(`^${escaped}$`, "i") },
      });

      if (existingUserWithUsername) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken. Please choose another username.",
        });
      }

      cleanUsername = rawUsername;
    } else {
      // User provided email only -> generate friendly unique username
      let base = (name || rawEmail.split("@")[0] || "user")
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9_.-]/g, "_")
        .replace(/_+/g, "_");
      if (base.length < 3) base = "user_" + base;

      let candidate = base;
      const escapedCandidate = escapeRegex(candidate);
      let existingCandidate = await Auth.findOne({
        username: { $regex: new RegExp(`^${escapedCandidate}$`, "i") },
      });

      if (existingCandidate) {
        candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
      cleanUsername = candidate;
    }

    // 2. Process email if provided
    if (rawEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      const existingUserWithEmail = await Auth.findOne({ email: rawEmail });
      if (existingUserWithEmail) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      cleanEmail = rawEmail;
    }

    const age = calculateAge(dob);

    if (age === null) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date of birth",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createPayload = {
      name: name.trim(),
      username: cleanUsername,
      password: hashedPassword,
      mobileNumber: mobile.trim(),
      gender,
      dob,
      address: address.trim(),
      city: city.trim(),
      bloodGroup,
      age,
      isFirstLogin: true,
      loginCount: 0,
      status: "pending",
    };

    if (cleanEmail) {
      createPayload.email = cleanEmail;
    }

    if (caste && typeof caste === "string") {
      createPayload.caste = caste.trim();
    }

    if (short_desc && typeof short_desc === "string") {
      createPayload.short_desc = short_desc.trim();
    }

    // Process category (User's own group)
    if (category !== undefined && category !== null) {
      const rawCategory = category;
      if (rawCategory === "All" || rawCategory === "all") {
        createPayload.category = "All";
      } else if (
        !rawCategory ||
        rawCategory === "none" ||
        rawCategory === "null" ||
        String(rawCategory).trim() === ""
      ) {
        createPayload.category = null;
      } else {
        try {
          const parsed = typeof rawCategory === "string" ? JSON.parse(rawCategory) : rawCategory;
          if (Array.isArray(parsed)) {
            if (parsed.includes("All") || parsed.includes("all")) {
              createPayload.category = "All";
            } else {
              const validIds = parsed
                .map((id) => (typeof id === "object" && id._id ? String(id._id) : String(id)).trim())
                .filter((id) => mongoose.Types.ObjectId.isValid(id) && id.length === 24)
                .map((id) => new mongoose.Types.ObjectId(id));
              createPayload.category = validIds.length > 0 ? validIds : null;
            }
          } else {
            const cleanStr = String(rawCategory).trim();
            if (mongoose.Types.ObjectId.isValid(cleanStr) && cleanStr.length === 24) {
              createPayload.category = [new mongoose.Types.ObjectId(cleanStr)];
            } else {
              createPayload.category = null;
            }
          }
        } catch (e) {
          const cleanStr = String(rawCategory).trim();
          if (mongoose.Types.ObjectId.isValid(cleanStr) && cleanStr.length === 24) {
            createPayload.category = [new mongoose.Types.ObjectId(cleanStr)];
          } else {
            createPayload.category = null;
          }
        }
      }
    }

    // Process allowedCategories (Groups user wants to view)
    if (allowedCategories !== undefined && allowedCategories !== null) {
      const rawAllowed = allowedCategories;
      if (rawAllowed === "All" || rawAllowed === "all") {
        createPayload.isAllCategories = true;
        createPayload.allowedCategories = [];
      } else if (
        !rawAllowed ||
        rawAllowed === "none" ||
        rawAllowed === "null" ||
        String(rawAllowed).trim() === ""
      ) {
        createPayload.isAllCategories = false;
        createPayload.allowedCategories = [];
      } else {
        try {
          const parsed = typeof rawAllowed === "string" ? JSON.parse(rawAllowed) : rawAllowed;
          if (Array.isArray(parsed)) {
            if (parsed.includes("All") || parsed.includes("all")) {
              createPayload.isAllCategories = true;
              createPayload.allowedCategories = [];
            } else {
              const validIds = parsed
                .map((id) => (typeof id === "object" && id._id ? String(id._id) : String(id)).trim())
                .filter((id) => mongoose.Types.ObjectId.isValid(id) && id.length === 24)
                .map((id) => new mongoose.Types.ObjectId(id));
              createPayload.isAllCategories = false;
              createPayload.allowedCategories = validIds;
            }
          } else {
            const cleanStr = String(rawAllowed).trim();
            createPayload.isAllCategories = false;
            if (mongoose.Types.ObjectId.isValid(cleanStr) && cleanStr.length === 24) {
              createPayload.allowedCategories = [new mongoose.Types.ObjectId(cleanStr)];
            } else {
              createPayload.allowedCategories = [];
            }
          }
        } catch (e) {
          const cleanStr = String(rawAllowed).trim();
          createPayload.isAllCategories = false;
          if (mongoose.Types.ObjectId.isValid(cleanStr) && cleanStr.length === 24) {
            createPayload.allowedCategories = [new mongoose.Types.ObjectId(cleanStr)];
          } else {
            createPayload.allowedCategories = [];
          }
        }
      }
    }

    // Process uploaded files if any
    if (req.files?.profile_photo?.[0]) {
      const result = await uploadToCloudinary(
        req.files.profile_photo[0].buffer,
        "bhartiy/profile-photos",
        "image"
      );
      createPayload.profile_photo = result.secure_url;
    }

    if (req.files?.resume?.[0]) {
      const result = await uploadToCloudinary(
        req.files.resume[0].buffer,
        "bhartiy/resumes",
        "auto"
      );
      createPayload.resume = result.secure_url;
    }

    if (req.files?.biodata?.[0]) {
      const result = await uploadToCloudinary(
        req.files.biodata[0].buffer,
        "bhartiy/biodata",
        "auto"
      );
      createPayload.biodata = result.secure_url;
    }

    const newUser = await Auth.create(createPayload);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
      },
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
