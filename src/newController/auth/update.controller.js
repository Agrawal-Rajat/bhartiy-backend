import Auth from "../../models/AuthModel/auth.model.js";
import MatrimonyCategory from "../../models/MatrimonyCategoryModel/matrimony.category.model.js";
import mongoose from "mongoose";
import { upload } from "../../middlewares/multer.middleware.js";
import { calculateAge } from "./signup.controller.js";
import cloudinary from "../../config/cloudinary.js";
const userfiles = upload("userfile").fields([
  { name: "profile_photo", maxCount: 1 },
  { name: "resume", maxCount: 1 },
  { name: "biodata", maxCount: 1 },
]);


const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const UserUpdateController = async (req, res) => {
  try {
    const {
      id,
      name,
      address,
      city,
      username,
      dob,
      email,
      gender,
      caste,
      bloodGroup,
      mobileNumber,
      short_desc,
      category,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await Auth.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let age = user.age;
    if (dob) {
      age = calculateAge(dob);
      if (age === null) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid date of birth",
        });
      }
    }

    const userEmail = (email || user.email || "").trim().toLowerCase();

    if (userEmail && userEmail !== user.email) {
      const existingUser = await Auth.findOne({
        email: userEmail,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Another user already exists with this email",
        });
      }
    }

    let updatedUsername = user.username;
    if (username !== undefined) {
      const cleanUsername = String(username).trim();
      if (cleanUsername && cleanUsername !== user.username) {
        if (cleanUsername.length < 3) {
          return res.status(400).json({
            success: false,
            message: "Username must be at least 3 characters",
          });
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
          return res.status(400).json({
            success: false,
            message:
              "Username can only contain letters, numbers, underscores (_), dots (.), and hyphens (-) without spaces",
          });
        }
        const escaped = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const existingUsernameUser = await Auth.findOne({
          username: { $regex: new RegExp(`^${escaped}$`, "i") },
          _id: { $ne: id },
        });

        if (existingUsernameUser) {
          return res.status(409).json({
            success: false,
            message: "Another user already has this username",
          });
        }
        updatedUsername = cleanUsername;
      }
    }

    const updateData = {
      name: name !== undefined ? String(name).trim() : (user.name || ""),
      address: address !== undefined ? String(address).trim() : user.address,
      city: city !== undefined ? String(city).trim() : user.city,
      username: updatedUsername,
      dob: dob || user.dob,
      age: age || user.age,
      email: userEmail || user.email,
      gender: gender || user.gender,
      caste: caste !== undefined ? String(caste).trim() : (user.caste || ""),
      bloodGroup: bloodGroup !== undefined ? String(bloodGroup).trim() : (user.bloodGroup || ""),
      mobileNumber: mobileNumber !== undefined ? String(mobileNumber).trim() : user.mobileNumber,
      short_desc: short_desc !== undefined ? String(short_desc).trim() : (user.short_desc || ""),
    };

    /* ================= MATRIMONY CATEGORY ================= */
    if (category !== undefined) {
      let rawCat = category;
      if (typeof rawCat === "string") {
        try {
          rawCat = JSON.parse(rawCat);
        } catch (e) {
          // not JSON, keep as raw string
        }
      }

      if (Array.isArray(rawCat)) {
        if (rawCat.includes("All") || rawCat.includes("all")) {
          updateData.category = "All";
          updateData.isAllCategories = true;
          updateData.allowedCategories = [];
        } else {
          const cleanList = rawCat
            .map((c) => String(c).trim())
            .filter((c) => c && c !== "null" && c !== "undefined" && c !== "none");
          updateData.category = cleanList;
          updateData.isAllCategories = false;
          updateData.allowedCategories = cleanList
            .filter((c) => mongoose.Types.ObjectId.isValid(c) && c.length === 24)
            .map((c) => new mongoose.Types.ObjectId(c));
        }
      } else if (rawCat === "All" || String(rawCat).toLowerCase() === "all") {
        updateData.category = "All";
        updateData.isAllCategories = true;
        updateData.allowedCategories = [];
      } else if (
        !rawCat ||
        rawCat === "none" ||
        rawCat === "null" ||
        rawCat === "undefined" ||
        String(rawCat).trim() === ""
      ) {
        updateData.category = [];
        updateData.isAllCategories = false;
        updateData.allowedCategories = [];
      } else {
        const cleanCat = String(rawCat).trim();
        updateData.category = [cleanCat];
        updateData.isAllCategories = false;
        if (mongoose.Types.ObjectId.isValid(cleanCat) && cleanCat.length === 24) {
          updateData.allowedCategories = [new mongoose.Types.ObjectId(cleanCat)];
        } else {
          updateData.allowedCategories = [];
        }
      }

      // If user changed their category on an already approved profile with biodata, require admin re-verification
      if (user.biodata && user.status === "approved") {
        const formatCatKey = (catVal, isAll) => {
          if (isAll || catVal === "All") return "All";
          if (!catVal) return "";
          if (Array.isArray(catVal)) return [...catVal].map(String).sort().join(",");
          return String(catVal);
        };
        const prevKey = formatCatKey(user.category, user.isAllCategories);
        const newKey = formatCatKey(updateData.category, updateData.isAllCategories);
        if (prevKey !== newKey) {
          updateData.status = "pending";
        }
      }
    }

    /* ================= PROFILE IMAGE ================= */
    if (req.files?.profile_photo?.[0]) {
      const result = await uploadToCloudinary(
        req.files.profile_photo[0].buffer,
        "bhartiy/profile-photos",
        "image"
      );

      updateData.profile_photo = result.secure_url;
    }

    /* ================= RESUME ================= */
    if (req.files?.resume?.[0]) {
      const result = await uploadToCloudinary(
        req.files.resume[0].buffer,
        "bhartiy/resumes",
        "auto"
      );

      updateData.resume = result.secure_url;
    }

    /* ================= BIODATA ================= */
    if (req.files?.biodata?.[0]) {
      const result = await uploadToCloudinary(
        req.files.biodata[0].buffer,
        "bhartiy/biodata",
        "auto"
      );

      updateData.biodata = result.secure_url;
      // When a user uploads biodata, it goes to admin/sub-admin for approval
      updateData.status = "pending";
      updateData.isAllViewers = false;
      updateData.allowedViewers = [];
    }

    const updatedUser = await Auth.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    if (safeUser.category && safeUser.category !== "All" && mongoose.Types.ObjectId.isValid(safeUser.category)) {
      const categoryDoc = await MatrimonyCategory.findById(safeUser.category).lean();
      if (categoryDoc) {
        safeUser.categoryDetails = categoryDoc;
      }
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: safeUser,
    });

  } catch (error) {
    console.error("Error in UserUpdateController:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
};

export { UserUpdateController, userfiles };
