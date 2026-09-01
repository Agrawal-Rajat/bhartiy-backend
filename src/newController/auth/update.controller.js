import Auth from "../../models/AuthModel/auth.model.js";
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
      address,
      city,
      username,
      dob,
      email,
      gender,
      caste,
      bloodGroup,
      mobileNumber,
      short_desc
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

    const updateData = {
      address: address !== undefined ? String(address).trim() : user.address,
      city: city !== undefined ? String(city).trim() : user.city,
      username: username !== undefined ? String(username).trim() : user.username,
      dob: dob || user.dob,
      age: age || user.age,
      email: userEmail || user.email,
      gender: gender || user.gender,
      caste: caste !== undefined ? String(caste).trim() : (user.caste || ""),
      bloodGroup: bloodGroup !== undefined ? String(bloodGroup).trim() : (user.bloodGroup || ""),
      mobileNumber: mobileNumber !== undefined ? String(mobileNumber).trim() : user.mobileNumber,
      short_desc: short_desc !== undefined ? String(short_desc).trim() : (user.short_desc || ""),
    };

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
    }

    const updatedUser = await Auth.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    const safeUser = updatedUser.toObject();
    delete safeUser.password;

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
