import { upload } from "../../middlewares/multer.middleware.js";
import HomeBanner from "../../models/HomeBannerModal/home_banner.model.js";
import cloudinary from "../../config/cloudinary.js";

const HomePosters = upload("home_posters").any();

const uploadBufferToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

const getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("/upload/")) return null;

  return imageUrl
    .split("/upload/")[1]
    ?.replace(/^v\d+\//, "")
    ?.replace(/\.[^/.]+$/, "");
};

const homeInsertController = async (req, res) => {
  try {
    const { heading, subheading } = req.body;
    let poster = null;

    if (req.files?.[0]?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(
        req.files[0].buffer,
        "home_posters",
      );
      poster = uploadResult.secure_url;
    }

    if (!heading || !subheading || !poster) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newHomeBanner = new HomeBanner({
      heading,
      subheading,
      poster,
    });

    await newHomeBanner.save();

    return res.status(201).json({
      success: true,
      message: "Home banner created successfully",
      data: newHomeBanner,
    });
  } catch (error) {
    console.error("Error in HomeInsertController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message || error,
    });
  }
};

const getHomeBannerData = async (req, res) => {
  try {
    var data = data = await HomeBanner.find({}).sort({ createdAt: -1 })

    res.status(201).json({ success: true, message: "Home banner data fetched successfully", data: data });
  } catch (error) {
    console.error("Error fetching Home banner data:", error);
    res.status(500).json({ success: false, message: "Error fetching Home banner data", error: error.message || error });
  }
};

const EditHomeData = async (req, res) => {
  try {
    const { _id, heading, subheading, poster } = req.body;
    const homeContent = await HomeBanner.findById(_id);

    if (!homeContent) {
      return res.status(404).json({
        success: false,
        message: "Home banner not found",
      });
    }

    let newPoster = null;

    if (req.files?.[0]?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(
        req.files[0].buffer,
        "home_posters",
      );
      newPoster = uploadResult.secure_url;
    }

    const updated = await HomeBanner.findByIdAndUpdate(
      _id,
      {
        heading,
        subheading,
        poster: newPoster || poster || homeContent.poster,
      },
      { new: true },
    );

    if (newPoster && homeContent.poster) {
      const publicId = getCloudinaryPublicId(homeContent.poster);

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Home data Edited successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error fetching Home data Edited:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching Home data Edited",
      error: error.message || error,
    });
  }
};

const DeleteHomeContent = async (req, res) => {
  try {
    const { id } = req.params;
    const homeContent = await HomeBanner.findById(id);

    if (!homeContent) {
      return res.status(404).json({
        success: false,
        message: "Home banner not found",
      });
    }

    if (homeContent.poster) {
      const publicId = getCloudinaryPublicId(homeContent.poster);

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await HomeBanner.findByIdAndDelete(id);

    return res.status(201).json({
      success: true,
      message: "Home Content Deleting successfully",
    });
  } catch (error) {
    console.error("Error Deleting HomeContent :", error);
    return res.status(500).json({
      success: false,
      message: "Error Deleting HomeContent",
      error: error.message || error,
    });
  }
};


export { homeInsertController, getHomeBannerData, EditHomeData, DeleteHomeContent, HomePosters };