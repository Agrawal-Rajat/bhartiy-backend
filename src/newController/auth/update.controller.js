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


export const uploadToCloudinary = (fileBuffer, folder, resourceType = "auto") => {
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
      allowedCategories,
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

    /* ================= OPTION 1: USER'S OWN GROUP (CATEGORY) ================= */
    let categoryChanged = false;
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
        } else {
          const cleanList = rawCat
            .map((c) => String(c).trim())
            .filter((c) => c && c !== "null" && c !== "undefined" && c !== "none");
          updateData.category = cleanList;
        }
      } else if (rawCat === "All" || String(rawCat).toLowerCase() === "all") {
        updateData.category = "All";
      } else if (
        !rawCat ||
        rawCat === "none" ||
        rawCat === "null" ||
        rawCat === "undefined" ||
        String(rawCat).trim() === ""
      ) {
        updateData.category = [];
      } else {
        const cleanCat = String(rawCat).trim();
        updateData.category = [cleanCat];
      }

      const formatCatKey = (catVal) => {
        if (catVal === "All") return "All";
        if (!catVal) return "";
        if (Array.isArray(catVal)) return [...catVal].map(String).sort().join(",");
        return String(catVal);
      };
      const prevKey = formatCatKey(user.category);
      const newKey = formatCatKey(updateData.category);
      if (prevKey !== newKey) {
        categoryChanged = true;
      }
    }

    /* ================= OPTION 2: GROUPS USER WANTS TO SEE (ALLOWED CATEGORIES) ================= */
    let allowedChanged = false;
    if (allowedCategories !== undefined) {
      let rawAllowed = allowedCategories;
      if (typeof rawAllowed === "string") {
        try {
          rawAllowed = JSON.parse(rawAllowed);
        } catch (e) {
          // not JSON, keep as raw string
        }
      }

      if (Array.isArray(rawAllowed)) {
        if (rawAllowed.includes("All") || rawAllowed.includes("all")) {
          updateData.isAllCategories = true;
          updateData.allowedCategories = [];
        } else {
          updateData.isAllCategories = false;
          updateData.allowedCategories = rawAllowed
            .map((c) => String(c).trim())
            .filter((c) => mongoose.Types.ObjectId.isValid(c) && c.length === 24)
            .map((c) => new mongoose.Types.ObjectId(c));
        }
      } else if (rawAllowed === "All" || String(rawAllowed).toLowerCase() === "all") {
        updateData.isAllCategories = true;
        updateData.allowedCategories = [];
      } else if (
        !rawAllowed ||
        rawAllowed === "none" ||
        rawAllowed === "null" ||
        rawAllowed === "undefined" ||
        String(rawAllowed).trim() === ""
      ) {
        updateData.isAllCategories = false;
        updateData.allowedCategories = [];
      } else {
        const cleanAllowed = String(rawAllowed).trim();
        updateData.isAllCategories = false;
        if (mongoose.Types.ObjectId.isValid(cleanAllowed) && cleanAllowed.length === 24) {
          updateData.allowedCategories = [new mongoose.Types.ObjectId(cleanAllowed)];
        } else {
          updateData.allowedCategories = [];
        }
      }

      const formatAllowedKey = (allowedList, isAll) => {
        if (isAll) return "All";
        if (!Array.isArray(allowedList)) return "";
        return [...allowedList]
          .map((id) => (typeof id === "object" && id._id ? String(id._id) : String(id)))
          .sort()
          .join(",");
      };
      const prevAllowedKey = formatAllowedKey(user.allowedCategories, user.isAllCategories);
      const newAllowedKey = formatAllowedKey(updateData.allowedCategories, updateData.isAllCategories);
      if (prevAllowedKey !== newAllowedKey) {
        allowedChanged = true;
      }
    }

    const isRegularUser = user.role !== "admin" && user.role !== "subadmin";
    const biodataUploaded = Boolean(req.files?.biodata?.[0]);

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

    /* ================= BIODATA UPLOAD ================= */
    let uploadedBiodataUrl = null;
    if (biodataUploaded) {
      const result = await uploadToCloudinary(
        req.files.biodata[0].buffer,
        "bhartiy/biodata",
        "auto"
      );
      uploadedBiodataUrl = result.secure_url;
    }

    /* ================= CHANGE APPROVAL & STAGING ================= */
    if (user.status === "approved" && isRegularUser) {
      // User is already approved.
      // Every time the user changes the biodata or changes any category,
      // it goes to the admin/subadmin portal for approval.
      // Until then, the old approved remains in active use!
      if (categoryChanged || allowedChanged || biodataUploaded) {
        updateData.hasPendingChanges = true;
        updateData.pendingChangeDate = new Date();

        // 1. Pending category (user's own group)
        if (categoryChanged) {
          updateData.pendingCategory = updateData.category;
        } else if (user.pendingCategory !== undefined && user.hasPendingChanges) {
          updateData.pendingCategory = user.pendingCategory;
        } else {
          updateData.pendingCategory = user.category;
        }
        // Retain currently approved category in active use
        updateData.category = user.category;

        // 2. Pending viewing groups (allowedCategories & isAllCategories)
        if (allowedChanged) {
          updateData.pendingAllowedCategories = updateData.allowedCategories;
          updateData.pendingIsAllCategories = updateData.isAllCategories;
        } else if (user.pendingAllowedCategories !== undefined && user.hasPendingChanges) {
          updateData.pendingAllowedCategories = user.pendingAllowedCategories;
          updateData.pendingIsAllCategories = user.pendingIsAllCategories;
        } else {
          updateData.pendingAllowedCategories = user.allowedCategories;
          updateData.pendingIsAllCategories = user.isAllCategories;
        }
        // Retain currently approved allowedCategories in active use
        updateData.allowedCategories = user.allowedCategories;
        updateData.isAllCategories = user.isAllCategories;

        // 3. Pending biodata
        if (uploadedBiodataUrl) {
          updateData.pendingBiodata = uploadedBiodataUrl;
        } else if (user.pendingBiodata && user.hasPendingChanges) {
          updateData.pendingBiodata = user.pendingBiodata;
        }
        // Retain currently approved biodata in active use
        updateData.biodata = user.biodata;

        // Remain approved so user can continue viewing matrimony profiles with approved permissions
        updateData.status = "approved";
      } else {
        // No changes to biodata or category: retain active approved data
        updateData.category = user.category;
        updateData.allowedCategories = user.allowedCategories;
        updateData.isAllCategories = user.isAllCategories;
        updateData.biodata = user.biodata;
        updateData.status = "approved";
      }
    } else {
      // First-time or not-yet-approved user (pending or rejected):
      if (uploadedBiodataUrl) {
        updateData.biodata = uploadedBiodataUrl;
      }
      if (isRegularUser) {
        updateData.status = "pending";
        updateData.hasPendingChanges = false;
        updateData.isAllViewers = false;
        updateData.allowedViewers = [];
      }
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
