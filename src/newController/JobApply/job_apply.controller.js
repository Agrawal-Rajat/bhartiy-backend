import JobApplies from "../../models/JobApplies/job_applies.model.js"

const ApplyToJob = async (req, res) => {
  try {
    const { userID, JobID } = req.body;

    if (!userID || !JobID) {
      return res.status(400).json({
        status: false,
        message: "User ID and Job ID are required",
      });
    }

    const existingApplication = await JobApplies.findOne({ userID, JobID });

    if (existingApplication) {
      return res.status(409).json({
        status: false,
        message: "You have already applied for this job",
      });
    }

    const application = await JobApplies.create({
      userID,
      JobID,
    });

    return res.status(201).json({
      status: true,
      message: "Applied to job successfully",
      application,
    });
  } catch (error) {
    console.error("JobApplyData Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
}

const GetJobAppilcants = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.status(400).json({ status: false, message: "Job ID is required" });
    }
    // console.log(id)
    const applicants = await JobApplies.find({ JobID: id }).populate("userID")
    return res.status(200).json({ status: true, message: " Job Applicants Found Successfully", applicants: applicants })

  } catch (error) {
    console.error("JobApllicantsData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

const GetJobAppilcantById = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.status(400).json({ status: false, message: "User ID is required" });
    }
    // console.log(id)
    const applicants = await JobApplies.find({ userID: id }).populate("userID").populate("JobID")
    return res.status(200).json({ status: true, message: " Job Applicant Found Successfully", applicants: applicants })

  } catch (error) {
    console.error("JobApllicantData Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}
const updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body
    if (!id || !status) {
      return res.status(400).json({
        status: false,
        message: "Application ID and status are required",
      });
    }
    const updates = await JobApplies.findByIdAndUpdate(id, { status: status }, { new: true })
    if (!updates) {
      return res.status(404).json({
        status: false,
        message: "Job application not found",
      });
    }
    return res.status(200).json({ status: true, message: " Job Applicant Data Status Updated Successfully", updated: updates })

  } catch (error) {
    console.error("JobApllicantsData Status Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }

}
export { ApplyToJob, GetJobAppilcants, updateStatus, GetJobAppilcantById }