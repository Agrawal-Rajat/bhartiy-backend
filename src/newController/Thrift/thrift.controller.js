import { upload } from "../../middlewares/multer.middleware.js";
import Thrift from "../../models/ThriftModel/thrift.model.js";
import cloudinary from "../../config/cloudinary.js";


const ThriftPosters = upload("thrift_posters").any();

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

const ThriftInsertController = async (req, res) => {
  try {
    // console.log(req.body)
    const { title, description, amount, seller, category } = req.body;
    let poster = null;

    if (req.files?.[0]?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(
        req.files[0].buffer,
        "thrift_posters",
      );
      poster = uploadResult.secure_url;
    }
    // console.log(req.files)
    if (!title || !description || !amount || !seller || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const newThrift = new Thrift({
      title,
      description,
      amount,
      seller,
      category,
      poster,
    });
    await newThrift.save();
    return res.status(201).json({
      success: true,
      message: "Thrift created successfully",
      data: newThrift,
    });
  } catch (error) {
    console.error("Error in ThriftInsertController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getThriftData = async (req, res) => {
  try {
    const { page, limit, filter } = req.query;
    console.log(page, limit, filter)
    const pagenumber = parseInt(page ? page : 1)
    const limitpage = parseInt(limit ? limit : 1000)
    const skip = (page - 1) * limit;
    var totalRecords;
    var data;
    if (filter === "ALL") {
      totalRecords = await Thrift.countDocuments({ status: "approved" });
      data = await Thrift.find({ status: "approved" }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage);
    }
    else {
      totalRecords = await Thrift.countDocuments({ category: filter, status: "approved" });
      data = await Thrift.find({ category: filter, status: "approved" }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage);
    }

    res.status(201).json({
      success: true, message: "Thrift data fetched successfully", data: data, pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitpage),
        currentPage: pagenumber,
        limitpage
      }
    });
  } catch (error) {
    console.error("Error fetching Thrift data:", error);
    res.status(500).json({ success: false, message: "Error fetching Thrift data", error: error.message || error });
  }
};

const getThriftDataForAdmin = async (req, res) => {
  try {
    const { page, limit, filter } = req.query;
    console.log(page, limit, filter)
    const pagenumber = parseInt(page ? page : 1)
    const limitpage = parseInt(limit ? limit : 1000)
    const skip = (page - 1) * limit;
    var totalRecords;
    var data;
    if (filter === "ALL") {
      totalRecords = await Thrift.countDocuments();
      data = await Thrift.find().sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage).populate("category");
    }
    else {
      totalRecords = await Thrift.countDocuments({ category: filter });
      data = await Thrift.find({ category: filter }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage).populate("category");
    }

    res.status(201).json({
      success: true, message: "Thrift data for admin fetched successfully", data: data, pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitpage),
        currentPage: pagenumber,
        limitpage
      }
    });
  } catch (error) {
    console.error("Error fetching Thrift data for admin:", error);
    res.status(500).json({ success: false, message: "Error fetching Thrift data for admin", error: error.message || error });
  }
};
const EditThriftData = async (req, res) => {
  try {
    const { _id, title, description, poster, seller, amount, category } = req.body;
    const thriftContent = await Thrift.findById(_id);
    let newPoster = null;

    if (req.files?.[0]?.buffer) {
      const uploadResult = await uploadBufferToCloudinary(
        req.files[0].buffer,
        "thrift_posters",
      );
      newPoster = uploadResult.secure_url;
    }

    const updated = await Thrift.findByIdAndUpdate(
      _id,
      {
        title: title,
        description: description,
        poster: newPoster || poster,
        seller: seller,
        amount: amount,
        category: category,
      },
      { new: true },
    );

    if (newPoster && thriftContent?.poster) {
      const publicId = thriftContent.poster
        .split("/upload/")[1]
        ?.replace(/^v\d+\//, "")
        ?.replace(/\.[^/.]+$/, "");

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Thrift data Edited successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error fetching Thrift data Edited:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching Thrift data Edited",
      error: error.message || error,
    });
  }
};

const DeleteThriftContent = async (req, res) => {
  try {
    const { id } = req.params;
    const thriftContent = await Thrift.findById(id);

    if (thriftContent?.poster) {
      const publicId = thriftContent.poster
        .split("/upload/")[1]
        ?.replace(/^v\d+\//, "")
        ?.replace(/\.[^/.]+$/, "");

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Thrift.findByIdAndDelete(id);

    res.status(201).json({
      success: true,
      message: "Thrift Content  Deleting successfully",
    });
  } catch (error) {
    console.error("Error Deleting ThriftContent :", error);
    res.status(500).json({
      success: false,
      message: "Error Deleting ThriftContent ",
      error: error.message || error,
    });
  }
};

const updateStatusOfThrift = async (req, res) => {
  try {
    const { id, status } = req.body
    const updates = await Thrift.findByIdAndUpdate(id, { status: status }, { new: true })
    console.log(req.body)
    return res.status(200).json({ status: true, message: "Thirft Data Status Updated Successfully", updated: updates })

  } catch (error) {
    console.error("Thirft Status Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
export { ThriftInsertController, updateStatusOfThrift, getThriftData, ThriftPosters, EditThriftData, DeleteThriftContent, getThriftDataForAdmin };