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
        role: "user",
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

    // Determine whether this is the user's first login
    let isFirstTime = false;
    if (user.loginCount !== undefined && user.loginCount > 0) {
      isFirstTime = false;
    } else if (user.isFirstLogin === false) {
      isFirstTime = false;
    } else if (user.isFirstLogin === true) {
      isFirstTime = true;
    } else {
      // For legacy user records where isFirstLogin was not explicitly defined:
      // If user has already configured profile details (photo, biodata, resume, short_desc, or category), treat as returning user
      const hasConfiguredProfile = Boolean(
        user.profile_photo ||
        user.biodata ||
        user.resume ||
        user.short_desc ||
        (Array.isArray(user.category) && user.category.length > 0) ||
        user.category === "All"
      );
      isFirstTime = !hasConfiguredProfile;
    }

    // Update login count and mark isFirstLogin as false for future logins
    user.loginCount = (user.loginCount || 0) + 1;
    user.isFirstLogin = false;
    await user.save();

    // Send success response
    res.status(200).json({
      message: "Successfully logged in",
      success: true,
      token: token,
      isFirstLogin: isFirstTime,
      user: {
        id: user._id,
        _id: user._id,
        auth_id: user._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email || "",
        role: "user",
        biodata: user.biodata || "",
        status: user.status || "pending",
        isFirstLogin: isFirstTime,
        loginCount: user.loginCount,
        allowedCategories: user.allowedCategories || [],
        category: user.category || null,
        isAllCategories: user.isAllCategories || false,
        isAllViewers: user.isAllViewers !== false,
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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await Auth.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (Array.isArray(user.category)) {
      const validIds = user.category.filter(
        (c) => c && typeof c === "string" && mongoose.Types.ObjectId.isValid(c) && c.length === 24
      );
      if (validIds.length > 0) {
        user.categoryDetails = await MatrimonyCategory.find({ _id: { $in: validIds } }).lean();
      } else {
        user.categoryDetails = [];
      }
    } else if (user.category && user.category !== "All" && mongoose.Types.ObjectId.isValid(user.category)) {
      const categoryDoc = await MatrimonyCategory.findById(user.category).lean();
      if (categoryDoc) {
        user.categoryDetails = [categoryDoc];
      }
    } else if (Array.isArray(user.allowedCategories) && user.allowedCategories.length > 0) {
      user.categoryDetails = await MatrimonyCategory.find({ _id: { $in: user.allowedCategories } }).lean();
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
    const { id, status } = req.body;
    const existing = await Auth.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateFields = { status };

    // When approving:
    if (status === "approved") {
      // If user has pending changes awaiting approval, commit them into active fields now!
      if (existing.hasPendingChanges) {
        if (existing.pendingBiodata) {
          updateFields.biodata = existing.pendingBiodata;
        }
        if (existing.pendingCategory !== undefined && existing.pendingCategory !== null) {
          updateFields.category = existing.pendingCategory;
        }
        if (existing.pendingAllowedCategories !== undefined && existing.pendingAllowedCategories.length > 0) {
          updateFields.allowedCategories = existing.pendingAllowedCategories;
          updateFields.isAllCategories = Boolean(existing.pendingIsAllCategories);
        } else if (existing.pendingIsAllCategories) {
          updateFields.isAllCategories = true;
          updateFields.allowedCategories = [];
        }

        // Clear pending staging fields
        updateFields.hasPendingChanges = false;
        updateFields.pendingBiodata = "";
        updateFields.pendingCategory = null;
        updateFields.pendingAllowedCategories = [];
        updateFields.pendingIsAllCategories = false;
        updateFields.pendingChangeDate = null;
      }

      // Ensure user's allowedCategories is initialized if empty
      const hasAllowed =
        (Array.isArray(updateFields.allowedCategories) && updateFields.allowedCategories.length > 0) ||
        (Array.isArray(existing.allowedCategories) && existing.allowedCategories.length > 0);
      const isAll = updateFields.isAllCategories !== undefined ? updateFields.isAllCategories : existing.isAllCategories;

      if (!hasAllowed && !isAll) {
        const activeCat = updateFields.category !== undefined ? updateFields.category : existing.category;
        if (activeCat === "All") {
          updateFields.isAllCategories = true;
          updateFields.isAllViewers = true;
        } else if (activeCat) {
          const catList = Array.isArray(activeCat) ? activeCat : [activeCat];
          const validIds = catList
            .filter((c) => mongoose.Types.ObjectId.isValid(c) && String(c).length === 24)
            .map((c) => new mongoose.Types.ObjectId(c));
          if (validIds.length > 0) {
            updateFields.allowedCategories = validIds;
          }
        }
      }
    } else if (status === "rejected") {
      // If user was already approved and had pending changes, rejecting cancels the pending change request
      // leaving their existing approved profile active!
      if (existing.hasPendingChanges && existing.status === "approved") {
        updateFields.status = "approved";
        updateFields.hasPendingChanges = false;
        updateFields.pendingBiodata = "";
        updateFields.pendingCategory = null;
        updateFields.pendingAllowedCategories = [];
        updateFields.pendingIsAllCategories = false;
        updateFields.pendingChangeDate = null;
      }
    }

    const user = await Auth.findByIdAndUpdate(id, updateFields, { new: true });
    res.status(200).json({
      success: true,
      status: true,
      message: "User Status Updated",
      user: user,
    });
  } catch (error) {
    console.error("Error updating user by status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
      error: error.message || error,
    });
  }
};
export { loginController };
