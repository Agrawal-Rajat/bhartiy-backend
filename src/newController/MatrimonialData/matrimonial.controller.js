import Auth from "../../models/AuthModel/auth.model.js";
import MatrimonialApplies from "../../models/MatrimonialApplies/matrimonial_applies.model.js";
import cloudinary from "../../config/cloudinary.js";
import bcrypt from "bcryptjs";

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

const GetMetrimonialData = async (req, res) => {
  try {
    const { page = 1, limit = 6, gender = "All", access, category } = req.query;
    const pageNumber = parseInt(page);
    const limitPage = parseInt(limit);
    const skip = (pageNumber - 1) * limitPage;

    // Base condition: biodata must exist
    let query = {
      biodata: { $exists: true, $ne: "" },
    };

    if (category && category !== "All") {
      query.$or = [
        { category: category },
        { category: "All" },
        { isAllCategories: true },
      ];
    }

    // Exclude gender if NOT "All"
    if (gender !== "All" && gender !== "other") {
      query.gender = { $ne: gender };
    }
    if (access === "user") {
      query.status = "approved";
    }

    const totalRecords = await Auth.countDocuments(query);

    const data = await Auth.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitPage);

    return res.status(200).json({
      success: true,
      message: "Biodata Records Found",
      data: data || [],
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitPage) || 1,
        currentPage: pageNumber,
        limit: limitPage,
      },
    });
  } catch (error) {
    console.error("GetMetrimonialData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const GetMatrimonialProfileStatusById = async (req, res) => {
  try {
    const { id } = req.body;
    const applicants = await MatrimonialApplies.find({ intrestedID: id })
      .populate("userID")
      .populate("intrestedID");
    return res.status(200).json({
      status: true,
      message: "Matrimonial Applicant Found Successfully",
      applicants: applicants,
    });
  } catch (error) {
    console.error("MatrimonialApllicantData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const AddIntrest = async (req, res) => {
  try {
    const { userID, intrestedID } = req.body;
    if (!userID && !intrestedID) {
      return res.status(500).json({ status: false, message: "All Field Are Required" });
    }
    await MatrimonialApplies.insertOne({ userID: userID, intrestedID: intrestedID });
    return res.status(200).json({ status: true, message: "Intreset Addedd" });
  } catch (error) {
    console.error("GetMetrimonialData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const GetMetrimonialProfileForAdmin = async (req, res) => {
  try {
    const resdata = await MatrimonialApplies.find({})
      .populate("userID")
      .populate("intrestedID");
    return res.status(200).json({
      success: true,
      message: "Profiles Fetched",
      data: resdata,
    });
  } catch (error) {
    console.error("GetMetrimonialData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const GetProfileLikers = async (req, res) => {
  try {
    const { id } = req.body;
    const applicants = await MatrimonialApplies.find({ userID: id }).populate("intrestedID");
    return res.status(200).json({
      status: true,
      message: "Profile Likers Fetched Successfully",
      applicants: applicants,
    });
  } catch (error) {
    console.error("GetProfileLikers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateStatusOfProfileLikers = async (req, res) => {
  try {
    const { id, status } = req.body;
    const updates = await Auth.findByIdAndUpdate(id, { status: status }, { new: true });
    return res.status(200).json({
      status: true,
      message: "Profile Likers Data Status Updated Successfully",
      updated: updates,
    });
  } catch (error) {
    console.error("Profile likers Status Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const insertMatrimonialProfile = async (req, res) => {
  try {
    const {
      username,
      gender = "other",
      dob,
      age,
      caste = "",
      city = "",
      address = "",
      mobileNumber = "",
      email,
      bloodGroup = "",
      short_desc = "",
      category = "All",
    } = req.body;

    // Biodata document is compulsory!
    if (!req.files?.biodata?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Biodata document (PDF) is compulsory",
      });
    }

    // Upload Biodata document to Cloudinary
    const bioResult = await uploadToCloudinary(
      req.files.biodata[0].buffer,
      "bhartiy/biodata",
      "auto"
    );
    const biodata_url = bioResult.secure_url;

    // Optional Profile Photo upload to Cloudinary
    let profile_photo_url = "";
    if (req.files?.profile_photo?.[0]) {
      const photoResult = await uploadToCloudinary(
        req.files.profile_photo[0].buffer,
        "bhartiy/profile_photos",
        "image"
      );
      profile_photo_url = photoResult.secure_url;
    }

    // Handle optional fields
    const finalUsername = username && username.trim() ? username.trim() : "Candidate Profile";
    const finalEmail =
      email && email.trim()
        ? email.trim().toLowerCase()
        : `biodata_${Date.now()}_${Math.floor(Math.random() * 10000)}@bhartiy.in`;

    const isAll = category === "All" || category === "all" || !category;
    const finalCategory = isAll ? "All" : category;
    const isAllCategories = isAll;

    let calculatedAge = age ? parseInt(age) : 0;
    let birthDate = dob ? new Date(dob) : null;

    let existingUser = await Auth.findOne({ email: finalEmail });
    if (existingUser) {
      if (username) existingUser.username = finalUsername;
      if (gender) existingUser.gender = gender;
      if (birthDate) existingUser.dob = birthDate;
      if (calculatedAge) existingUser.age = calculatedAge;
      if (caste) existingUser.caste = caste;
      if (city) existingUser.city = city;
      if (address) existingUser.address = address;
      if (mobileNumber) existingUser.mobileNumber = mobileNumber;
      if (bloodGroup) existingUser.bloodGroup = bloodGroup;
      if (short_desc) existingUser.short_desc = short_desc;
      existingUser.category = finalCategory;
      existingUser.isAllCategories = isAllCategories;
      if (profile_photo_url) existingUser.profile_photo = profile_photo_url;
      existingUser.biodata = biodata_url;
      existingUser.status = "approved";

      await existingUser.save();
      const populated = await Auth.findById(existingUser._id).populate("category");
      return res.status(200).json({
        success: true,
        message: "Matrimonial profile updated successfully",
        data: populated,
      });
    } else {
      const hashedPassword = await bcrypt.hash("Bhartiy@123", 10);
      const newUser = new Auth({
        username: finalUsername,
        email: finalEmail,
        password: hashedPassword,
        address: address || "",
        city: city || "",
        gender: gender || "other",
        caste: caste || "",
        bloodGroup: bloodGroup || "",
        status: "approved",
        mobileNumber: mobileNumber || "",
        dob: birthDate,
        age: calculatedAge,
        biodata: biodata_url,
        short_desc: short_desc || "",
        profile_photo: profile_photo_url,
        category: finalCategory,
        isAllCategories: isAllCategories,
      });

      await newUser.save();
      const populated = await Auth.findById(newUser._id).populate("category");
      return res.status(201).json({
        success: true,
        message: "Matrimonial profile and biodata created successfully",
        data: populated,
      });
    }
  } catch (error) {
    console.error("insertMatrimonialProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const DeleteMatrimonialProfile = async (req, res) => {
  try {
    const { id } = req.params;
    await Auth.findByIdAndDelete(id);
    await MatrimonialApplies.deleteMany({
      $or: [{ userID: id }, { intrestedID: id }],
    });
    return res.status(200).json({
      success: true,
      message: "Matrimonial profile deleted successfully",
    });
  } catch (error) {
    console.error("DeleteMatrimonialProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const DeleteBiodata = async (req, res) => {
  try {
    const { id } = req.params;
    await Auth.findByIdAndUpdate(id, { biodata: "" });
    return res.status(200).json({
      success: true,
      message: "Biodata removed successfully",
    });
  } catch (error) {
    console.error("DeleteBiodata Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export {
  GetMetrimonialData,
  AddIntrest,
  GetMetrimonialProfileForAdmin,
  GetProfileLikers,
  updateStatusOfProfileLikers,
  GetMatrimonialProfileStatusById,
  insertMatrimonialProfile,
  DeleteMatrimonialProfile,
  DeleteBiodata,
};
