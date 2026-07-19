import { upload } from "../../middlewares/multer.middleware.js";
import Property from "../../models/Property/property.model.js";
import cloudinary from "../../config/cloudinary.js";

const PropertyPosters = upload("property_posters").any();

const uploadBufferToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
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
const propertyInsertController = async (req, res) => {
  try {
    // console.log(req.body)
    const { title, description, category, location, amount, seller } = req.body;
    let poster = null;

    if (req.files?.[0]?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(
        req.files[0].buffer,
        "property_posters",
      );
      poster = uploadResult.secure_url;
    }
    // console.log(req.files)
    if (!title || !description || !category || !location || !amount || !seller) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const newProperty = new Property({
      title,
      description,
      category,
      location,
      amount,
      seller,
      poster,
    });
    await newProperty.save();
    return res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: newProperty,
    });
  } catch (error) {
    console.error("Error in propertyInsertController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getPropertiesData = async (req, res) => {
  try {
    const { page, limit, filter } = req.query;
    console.log(page, limit, filter)
    const pagenumber = parseInt(page ? page : 1)
    const limitpage = parseInt(limit ? limit : 1000)
    const skip = (page - 1) * limit;
    var totalRecords;
    var data;
    if (filter === "All") {
      totalRecords = await Property.countDocuments();
      data = await Property.find({}).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage);
    }
    else {
      totalRecords = await Property.countDocuments({ category: filter });
      data = await Property.find({ category: filter }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage);
    }

    res.status(201).json({
      success: true, message: "Property data fetched successfully", data: data, pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitpage),
        currentPage: pagenumber,
        limitpage
      }
    });
  } catch (error) {
    console.error("Error fetching property data:", error);
    res.status(500).json({ success: false, message: "Error fetching property data", error: error.message || error });
  }
};

const EditPropertiesData = async (req, res) => {
  try {
    console.log(req.body);
    const { _id, title, description, category, location, amount, seller, poster } = req.body;
    const property = await Property.findById(_id);
    let newPoster = null;

    if (req.files?.[0]?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(
        req.files[0].buffer,
        "property_posters",
      );
      newPoster = uploadResult.secure_url;
    }

    const updated = await Property.findByIdAndUpdate(
      _id,
      {
        title,
        description,
        category,
        location,
        amount,
        seller,
        poster: newPoster || poster || property?.poster,
      },
      { new: true },
    );

    if (newPoster && property?.poster) {
      const publicId = getCloudinaryPublicId(property.poster);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }
    return res.status(201).json({ success: true, message: "Property data Edited successfully", data: updated });
  } catch (error) {
    console.error("Error fetching property data Edited:", error);
    return res.status(500).json({ success: false, message: "Error fetching property data Edited", error: error.message || error });
  }
};

const DeleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.poster) {
      const publicId = getCloudinaryPublicId(property.poster);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Property.findByIdAndDelete(id);
    res.status(201).json({ success: true, message: "Property  Deleting successfully" });
  } catch (error) {
    console.error("Error Deleting property :", error);
    res.status(500).json({ success: false, message: "Error Deleting property ", error: error.message || error });
  }
};


export { propertyInsertController, getPropertiesData, PropertyPosters, EditPropertiesData, DeleteProperty };