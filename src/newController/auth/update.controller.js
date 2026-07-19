import Auth from "../../models/AuthModel/auth.model.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { calculateAge } from "./signup.controller.js";
import cloudinary from "../../config/cloudinary.js";
const userfiles = upload("userfile").fields([
  { name: "profile_photo", maxCount: 1 },
  { name: "resume", maxCount: 1 },
  { name: "biodata", maxCount: 1 },
]);


const uploadToCloudinary = (fileBuffer, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: "upload",
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

    const age = calculateAge(dob);

    if (age === null) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date of birth",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await Auth.findOne({
      email: normalizedEmail,
      _id: { $ne: id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Another user already exists with this email",
      });
    }

    const updateData = {
      address: address.trim(),
      username: username.trim(),
      dob,
      age,
      email: normalizedEmail,
      gender,
      caste: caste.trim(),
      bloodGroup: bloodGroup.trim(),
      mobileNumber: mobileNumber.trim(),
      short_desc: short_desc.trim(),
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
        "image"
      );

      updateData.resume = result.secure_url;
    }

    /* ================= BIODATA ================= */
    if (req.files?.biodata?.[0]) {
      const result = await uploadToCloudinary(
        req.files.biodata[0].buffer,
        "bhartiy/biodata",
        "image"
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
