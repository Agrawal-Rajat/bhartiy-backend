import Auth from "../../models/AuthModel/auth.model.js";
import MatrimonialApplies from "../../models/MatrimonialApplies/matrimonial_applies.model.js";
import MatrimonyCategory from "../../models/MatrimonyCategoryModel/matrimony.category.model.js";
import cloudinary from "../../config/cloudinary.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

const populateCategoriesForProfiles = async (profiles) => {
  if (!profiles || !profiles.length) return profiles;

  const categoryIds = [];
  for (const doc of profiles) {
    const cat = doc.category;
    if (Array.isArray(cat)) {
      for (const c of cat) {
        if (c && typeof c === "string" && mongoose.Types.ObjectId.isValid(c) && c.length === 24) {
          categoryIds.push(c);
        } else if (c && typeof c === "object" && c._id) {
          categoryIds.push(c._id);
        }
      }
    } else if (cat && typeof cat === "string" && mongoose.Types.ObjectId.isValid(cat) && cat.length === 24) {
      categoryIds.push(cat);
    } else if (cat && typeof cat === "object" && cat._id) {
      categoryIds.push(cat._id);
    }

    if (Array.isArray(doc.allowedCategories)) {
      for (const ac of doc.allowedCategories) {
        if (ac && typeof ac === "string" && mongoose.Types.ObjectId.isValid(ac) && ac.length === 24) {
          categoryIds.push(ac);
        } else if (ac && typeof ac === "object" && ac._id) {
          categoryIds.push(ac._id);
        }
      }
    }
  }

  if (categoryIds.length > 0) {
    const categories = await MatrimonyCategory.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));

    for (const doc of profiles) {
      const cat = doc.category;
      if (Array.isArray(cat)) {
        doc.category = cat
          .map((c) => {
            const idStr = typeof c === "object" && c._id ? c._id.toString() : c?.toString();
            return categoryMap.get(idStr) || c;
          })
          .filter(Boolean);
      } else if (cat && typeof cat === "string" && categoryMap.has(cat)) {
        doc.category = categoryMap.get(cat);
      } else if (cat && typeof cat === "object" && cat._id && categoryMap.has(cat._id.toString())) {
        doc.category = categoryMap.get(cat._id.toString());
      }

      if (Array.isArray(doc.allowedCategories)) {
        doc.allowedCategories = doc.allowedCategories
          .map((ac) => {
            const idStr = typeof ac === "object" && ac._id ? ac._id.toString() : ac?.toString();
            return categoryMap.get(idStr) || ac;
          })
          .filter(Boolean);
      }
    }
  }

  return profiles;
};

const GetMetrimonialData = async (req, res) => {
  try {
    const { page = 1, limit = 6, gender = "All", access, category, currentUserId, status } = req.query;
    const pageNumber = parseInt(page);
    const limitPage = parseInt(limit);
    const skip = (pageNumber - 1) * limitPage;

    const andConditions = [];

    // Base condition: biodata must exist
    let query = {
      biodata: { $exists: true, $ne: "" },
    };

    if (category && category !== "All") {
      const catOrConditions = [
        { category: category },
        { category: "All" },
        { isAllCategories: true },
        { isAllViewers: true },
        { allowedCategories: category },
      ];
      if (mongoose.Types.ObjectId.isValid(category) && category.length === 24) {
        const catObjId = new mongoose.Types.ObjectId(category);
        catOrConditions.push({ category: catObjId });
        catOrConditions.push({ allowedCategories: catObjId });
      }
      andConditions.push({
        $or: catOrConditions,
      });
    }

    // Exclude gender if NOT "All"
    if (gender !== "All" && gender !== "other") {
      query.gender = { $ne: gender };
    }

    if (access === "user") {
      query.status = "approved";

      let viewerId = currentUserId || req.user?.id;
      if (!viewerId) {
        const token =
          req.cookies?.token ||
          (req.headers?.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null);
        if (token && process.env.JWT_SECRET) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            viewerId = decoded?.id || decoded?._id;
          } catch (e) {
            // ignore invalid token
          }
        }
      }

      if (!viewerId || !mongoose.Types.ObjectId.isValid(viewerId)) {
        return res.status(200).json({
          success: true,
          message: "Please log in to view matrimonial profiles",
          data: [],
          isApproved: false,
          pagination: {
            totalRecords: 0,
            totalPages: 1,
            currentPage: 1,
            limit: limitPage,
          },
        });
      }

      const viewer = await Auth.findById(viewerId)
        .select("status allowedCategories category isAllCategories isAllViewers role")
        .lean();

      if (!viewer) {
        return res.status(200).json({
          success: true,
          message: "User not found",
          data: [],
          isApproved: false,
          pagination: {
            totalRecords: 0,
            totalPages: 1,
            currentPage: 1,
            limit: limitPage,
          },
        });
      }

      const isAdminOrSub = viewer.role === "admin" || viewer.role === "subadmin";

      // If user is not admin and NOT approved, they cannot see any biodatas
      if (!isAdminOrSub && viewer.status !== "approved") {
        return res.status(200).json({
          success: true,
          message:
            viewer.status === "rejected"
              ? "Your profile was rejected by the administrator. Please update your profile for re-verification."
              : "Your profile and category are pending approval by the admin or sub-admin. You will be able to view matrimonial profiles once approved.",
          data: [],
          isApproved: false,
          userStatus: viewer.status,
          pagination: {
            totalRecords: 0,
            totalPages: 1,
            currentPage: 1,
            limit: limitPage,
          },
        });
      }

      // Viewer is approved: determine which category of biodatas he/she can see
      const isViewerAll = viewer.isAllCategories === true || isAdminOrSub;

      if (!isViewerAll) {
        const viewerAllowedCatIds = [];
        if (Array.isArray(viewer.allowedCategories)) {
          viewer.allowedCategories.forEach((c) => {
            if (c && mongoose.Types.ObjectId.isValid(c)) {
              viewerAllowedCatIds.push(new mongoose.Types.ObjectId(c));
            }
          });
        }
        if (Array.isArray(viewer.category)) {
          viewer.category.forEach((c) => {
            if (c && mongoose.Types.ObjectId.isValid(c)) {
              viewerAllowedCatIds.push(new mongoose.Types.ObjectId(c));
            }
          });
        } else if (viewer.category && mongoose.Types.ObjectId.isValid(viewer.category)) {
          viewerAllowedCatIds.push(new mongoose.Types.ObjectId(viewer.category));
        }

        // If admin has not approved/assigned any category of biodata they can see:
        if (viewerAllowedCatIds.length === 0) {
          return res.status(200).json({
            success: true,
            message: "No matrimonial categories have been configured for your access by the admin yet.",
            data: [],
            isApproved: true,
            pagination: {
              totalRecords: 0,
              totalPages: 1,
              currentPage: 1,
              limit: limitPage,
            },
          });
        }

        // Restrict any query to ONLY candidate profiles that fall within the viewer's allowed categories
        andConditions.push({
          $or: [
            { _id: viewer._id },
            { category: { $in: viewerAllowedCatIds } },
            { allowedCategories: { $in: viewerAllowedCatIds } },
          ],
        });
      }
    } else if (status && status !== "All") {
      query.status = status;
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const totalRecords = await Auth.countDocuments(query);

    const rawData = await Auth.find(query)
      .populate({ path: "allowedViewers", model: "Auth", select: "username email mobileNumber gender city" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitPage)
      .lean();

    const data = await populateCategoriesForProfiles(rawData);

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
      const userDoc = await Auth.findById(existingUser._id).lean();
      const [populated] = await populateCategoriesForProfiles([userDoc]);
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
      const userDoc = await Auth.findById(newUser._id).lean();
      const [populated] = await populateCategoriesForProfiles([userDoc]);
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

const updateBiodataConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, isAllCategories, allowedCategories, allowedViewers, isAllViewers, status } = req.body;

    const updateFields = {};

    if (category !== undefined) {
      const isAll = category === "All" || category === "all" || !category;
      updateFields.category = isAll ? "All" : category;
      updateFields.isAllCategories = isAllCategories !== undefined ? isAllCategories : isAll;
    }

    if (allowedCategories !== undefined) {
      updateFields.allowedCategories = Array.isArray(allowedCategories)
        ? allowedCategories.filter((c) => mongoose.Types.ObjectId.isValid(c) && String(c).length === 24)
        : [];
    }

    if (allowedViewers !== undefined) {
      updateFields.allowedViewers = Array.isArray(allowedViewers) ? allowedViewers : [];
    }

    if (isAllViewers !== undefined) {
      updateFields.isAllViewers = Boolean(isAllViewers);
    }

    if (status !== undefined) {
      updateFields.status = status;
    }

    const updated = await Auth.findByIdAndUpdate(id, updateFields, { new: true })
      .populate({ path: "allowedViewers", model: "Auth", select: "username email mobileNumber gender city" })
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const [populated] = await populateCategoriesForProfiles([updated]);

    return res.status(200).json({
      success: true,
      message: "Biodata configuration updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("updateBiodataConfig Error:", error);
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
  updateBiodataConfig,
};
