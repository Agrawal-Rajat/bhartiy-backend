import { upload } from "../../middlewares/multer.middleware.js";
import Job from "../../models/JobsModel/job.model.js";
import cloudinary from "../../config/cloudinary.js";

const JobPosters = upload("job_posters").any();

const uploadJobPosterToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "bhartiy/job-posters",
        resource_type: "image",
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

const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const uploadPart = url.split("/upload/")[1];
    if (!uploadPart) return null;

    const withoutVersion = uploadPart.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

const deleteJobPosterFromCloudinary = async (posterUrl) => {
  const publicId = getCloudinaryPublicId(posterUrl);
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};

const jobInsertController = async (req, res) => {
  try {
    // console.log(req.body)
    const { title, description, category, location, salary, company, vacancies } = req.body;
    // console.log(req.files)
    if (!title || !description || !category || !location || !salary || !company || !vacancies) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    let poster = null;

    if (req.files?.[0]) {
      const uploadResult = await uploadJobPosterToCloudinary(
        req.files[0].buffer
      );
      poster = uploadResult.secure_url;
    }

    const newJob = new Job({
      title,
      description,
      category,
      location,
      salary,
      company,
      poster,
      vacancies
    });
    await newJob.save();
    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: newJob,
    });
  } catch (error) {
    console.error("Error in jobInsertController:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
};

const getJobsData = async (req, res) => {
  try {
    const { page, limit, filter } = req.query;
    console.log(page, limit, filter)
    const pagenumber = parseInt(page ? page : 1)
    const limitpage = parseInt(limit ? limit : 1000)
    const skip = (page - 1) * limit;
    var totalRecords;
    var data;
    if (filter === "All") {
      totalRecords = await Job.countDocuments();
      data = await Job.find({}).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage);
    }
    else {
      totalRecords = await Job.countDocuments({ category: filter });
      data = await Job.find({ category: filter }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitpage);
    }

    res.status(201).json({
      success: true, message: "Job data fetched successfully", data: data, pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitpage),
        currentPage: pagenumber,
        limitpage
      }
    });
  } catch (error) {
    console.error("Error fetching job data:", error);
    res.status(500).json({ success: false, message: "Error fetching job data", error: error.message || error });
  }
};

const EditJobsData = async (req, res) => {
  try {
    const {
      _id,
      title,
      description,
      category,
      location,
      salary,
      company,
      vacancies,
      poster,
    } = req.body;

    const job = await Job.findById(_id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    let posterUrl = poster || job.poster;

    if (req.files?.[0]) {
      const uploadResult = await uploadJobPosterToCloudinary(
        req.files[0].buffer
      );

      posterUrl = uploadResult.secure_url;

      if (job.poster) {
        try {
          await deleteJobPosterFromCloudinary(job.poster);
        } catch (deleteError) {
          console.error("Error deleting old Cloudinary poster:", deleteError);
        }
      }
    }

    const updated = await Job.findByIdAndUpdate(
      _id,
      {
        title,
        description,
        category,
        location,
        salary,
        company,
        poster: posterUrl,
        vacancies,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Job data Edited successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error fetching job data Edited:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching job data Edited",
      error: error.message || error,
    });
  }
};

const DeleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.poster) {
      try {
        await deleteJobPosterFromCloudinary(job.poster);
      } catch (deleteError) {
        console.error("Error deleting Cloudinary poster:", deleteError);
      }
    }

    await Job.findByIdAndDelete(id);

    return res.status(201).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error Deleting job:", error);
    return res.status(500).json({
      success: false,
      message: "Error Deleting job",
      error: error.message || error,
    });
  }
};


export { jobInsertController, getJobsData, JobPosters, EditJobsData, DeleteJob };