import { upload } from "../../middlewares/multer.middleware.js";
import Hero from "../../models/HeroModel/hero.model.js";

import cloudinary from "../../config/cloudinary.js";

const HeroPosters = upload("hero_posters").any();


const uploadBufferToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "hero_posters",
        resource_type: "image",
        transformation: [
          { width: 1920, height: 1080, crop: "limit" },
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

const getCloudinaryPublicIdFromUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    const uploadPath = url.pathname.split("/upload/")[1];
    if (!uploadPath) return null;

    return uploadPath
      .replace(/^v\d+\//, "")
      .replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

const heroInsertController = async (req, res) => {
  try {
    const { title, description } = req.body;
    const uploadedFile = req.files?.[0];

    if (!title || !description || !uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Title, description and poster are required",
      });
    }

    if (!uploadedFile.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image buffer was not received",
      });
    }

    const uploadResult = await uploadBufferToCloudinary(uploadedFile.buffer);

    const newHero = new Hero({
      title,
      description,
      poster: uploadResult.secure_url,
    });

    await newHero.save();

    return res.status(201).json({
      success: true,
      message: "Hero created successfully",
      data: newHero,
    });
  } catch (error) {
    console.error("Error in HeroInsertController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getHeroData = async (req, res) => {
  try {
    const { page, limit } = req.query;
    console.log(page, limit)
    const pagenumber = parseInt(page ? page : 1)
    const limitpage = parseInt(limit ? limit : 1000)
    const skip = (pagenumber - 1) * limitpage;
    var totalRecords = await Hero.countDocuments();
    var data = data = await Hero.find({}).sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitpage);

    res.status(201).json({
      success: true, message: "Hero data fetched successfully", data: data, pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitpage),
        currentPage: pagenumber,
        limitpage
      }
    });
  } catch (error) {
    console.error("Error fetching Hero data:", error);
    res.status(500).json({ success: false, message: "Error fetching Hero data", error: error.message || error });
  }
};

const EditHeroData = async (req, res) => {
  try {
    const { _id, title, description } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Hero ID is required",
      });
    }

    const heroContent = await Hero.findById(_id);

    if (!heroContent) {
      return res.status(404).json({
        success: false,
        message: "Hero content not found",
      });
    }

    const updateData = { title, description };

    if (req.files?.length) {
      const uploadedFile = req.files[0];

      if (!uploadedFile.buffer) {
        return res.status(400).json({
          success: false,
          message: "Image buffer was not received",
        });
      }

      const uploadResult = await uploadBufferToCloudinary(uploadedFile.buffer);

      updateData.poster = uploadResult.secure_url;

      const oldPosterPublicId = getCloudinaryPublicIdFromUrl(heroContent.poster);
      if (oldPosterPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPosterPublicId);
        } catch (deleteError) {
          console.error("Failed to delete old Hero poster from Cloudinary:", deleteError);
        }
      }
    }

    const updated = await Hero.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Hero data edited successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error editing Hero data:", error);
    return res.status(500).json({
      success: false,
      message: "Error editing Hero data",
      error: error.message || error,
    });
  }
};

const DeleteHeroContent = async (req, res) => {
  try {
    const { id } = req.params;
    const heroContent = await Hero.findById(id);

    if (!heroContent) {
      return res.status(404).json({
        success: false,
        message: "Hero content not found",
      });
    }

    const posterPublicId = getCloudinaryPublicIdFromUrl(heroContent.poster);
    if (posterPublicId) {
      try {
        await cloudinary.uploader.destroy(posterPublicId);
      } catch (deleteError) {
        console.error("Failed to delete Hero poster from Cloudinary:", deleteError);
      }
    }

    await Hero.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Hero content deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Hero content:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting Hero content",
      error: error.message || error,
    });
  }
};


export { heroInsertController, getHeroData, HeroPosters, EditHeroData, DeleteHeroContent };