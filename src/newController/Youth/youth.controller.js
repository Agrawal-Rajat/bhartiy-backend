import { upload } from "../../middlewares/multer.middleware.js";
import Youth from "../../models/YouthModel/youth.model.js";
import cloudinary from "../../config/cloudinary.js";


const YouthPosters = upload("youth_posters").any();

const uploadBufferToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

const youthInsertController = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !req.files?.length) {
      return res.status(400).json({
        success: false,
        message: "Title and image are required",
      });
    }

    const uploadedFile = req.files[0];

    if (!uploadedFile.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image buffer was not received",
      });
    }

    const uploadResult = await uploadBufferToCloudinary(
      uploadedFile.buffer,
      "youth_posters"
    );

    const poster = uploadResult.secure_url;
    const posterPublicId = uploadResult.public_id;

    const newYouth = new Youth({
      title,
      poster,
      posterPublicId,
    });

    await newYouth.save();

    return res.status(201).json({
      success: true,
      message: "Youth content created successfully",
      data: newYouth,
    });
  } catch (error) {
    console.error("Error in YouthInsertController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getYouthData = async (req, res) => {
  try {
    const { page, limit } = req.query;
    console.log(page, limit)
    const pagenumber = parseInt(page ? page : 1)
    const limitpage = parseInt(limit ? limit : 1000)
    const skip = (pagenumber - 1) * limitpage;
    var totalRecords = await Youth.countDocuments();
    var data = data = await Youth.find({}).sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitpage);

    res.status(201).json({
      success: true, message: "Youth data fetched successfully", data: data, pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitpage),
        currentPage: pagenumber,
        limitpage
      }
    });
  } catch (error) {
    console.error("Error fetching Youth data:", error);
    res.status(500).json({ success: false, message: "Error fetching Youth data", error: error.message || error });
  }
};

const EditYouthData = async (req, res) => {
  try {
    const { _id, title } = req.body;

    const youthContent = await Youth.findById(_id);

    if (!youthContent) {
      return res.status(404).json({
        success: false,
        message: "Youth content not found",
      });
    }

    const updateData = { title };

    if (req.files?.length) {
      const uploadedFile = req.files[0];

      if (!uploadedFile.buffer) {
        return res.status(400).json({
          success: false,
          message: "Image buffer was not received",
        });
      }

      const uploadResult = await uploadBufferToCloudinary(
        uploadedFile.buffer,
        "youth_posters"
      );

      updateData.poster = uploadResult.secure_url;
      updateData.posterPublicId = uploadResult.public_id;

      if (youthContent.posterPublicId) {
        try {
          await cloudinary.uploader.destroy(youthContent.posterPublicId);
        } catch (deleteError) {
          console.error("Failed to delete old Youth poster from Cloudinary:", deleteError);
        }
      }
    }

    const updated = await Youth.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Youth content updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Youth data:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating Youth data",
      error: error.message || error,
    });
  }
};

const DeleteYouthContent = async (req, res) => {
  try {
    const { id } = req.params;

    const youthContent = await Youth.findById(id);

    if (!youthContent) {
      return res.status(404).json({
        success: false,
        message: "Youth content not found",
      });
    }

    if (youthContent.posterPublicId) {
      await cloudinary.uploader.destroy(youthContent.posterPublicId);
    }

    await Youth.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Youth content deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Youth content:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting Youth content",
      error: error.message || error,
    });
  }
};


export { youthInsertController, getYouthData, YouthPosters, EditYouthData, DeleteYouthContent };