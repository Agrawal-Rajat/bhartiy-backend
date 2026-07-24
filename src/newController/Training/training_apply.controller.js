import TrainingApplies from "../../models/TrainingApplies/training_applies.model.js";

const ApplyToTraining = async (req, res) => {
    try {
        const { userID, TrainingID, resume } = req.body;

        if (!userID || !TrainingID) {
            return res.status(400).json({
                status: false,
                message: "User ID and Training ID are required",
            });
        }

        const existingApplication = await TrainingApplies.findOne({ userID, TrainingID });

        if (existingApplication) {
            return res.status(409).json({
                status: false,
                message: "You have already applied for this training",
            });
        }

        const application = await TrainingApplies.create({
            userID,
            TrainingID,
            resume,
        });

        return res.status(201).json({
            status: true,
            message: "Applied to training successfully",
            application,
        });
    } catch (error) {
        console.error("TrainingApplyData Error:", error);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal Server Error",
        });
    }
};

const GetTrainingApplicants = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: false, message: "Training ID is required" });
        }

        const applicants = await TrainingApplies.find({ TrainingID: id }).populate("userID");
        return res.status(200).json({
            status: true,
            message: "Training applicants found successfully",
            applicants,
        });
    } catch (error) {
        console.error("TrainingApplicantsData Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const GetTrainingApplicantById = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        const applicants = await TrainingApplies.find({ userID: id })
            .populate("userID")
            .populate({
                path: "TrainingID",
                match: { status: "Active" },
            });

        const filteredApplicants = applicants.filter(app => app.TrainingID);

        return res.status(200).json({
            status: true,
            message: "Training applicant found successfully",
            applicants: filteredApplicants,
        });
    } catch (error) {
        console.error("TrainingApplicantData Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            return res.status(400).json({
                status: false,
                message: "Application ID and status are required",
            });
        }

        const updates = await TrainingApplies.findByIdAndUpdate(id, { status }, { new: true });
        if (!updates) {
            return res.status(404).json({
                status: false,
                message: "Training application not found",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Training applicant status updated successfully",
            updated: updates,
        });
    } catch (error) {
        console.error("TrainingApplicantsData Status Update Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export { ApplyToTraining, GetTrainingApplicants, GetTrainingApplicantById, updateStatus };