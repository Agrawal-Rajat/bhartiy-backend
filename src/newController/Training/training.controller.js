import Training from "../../models/TraningModel/training.model.js";
import cloudinary from "../../config/cloudinary.js";
import { upload } from "../../middlewares/multer.middleware.js";

export const TrainingPosters = upload("training_posters").any();

const uploadTrainingPosterToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "bhartiy/training-posters",
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
    if (!url) return null;
    const parts = url.split("/");
    const fileName = parts[parts.length - 1].split(".")[0];
    return `bhartiy/training-posters/${fileName}`;
};

const deleteTrainingPosterFromCloudinary = async (posterUrl) => {
    const publicId = getCloudinaryPublicId(posterUrl);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
        });
    } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
    }
};

export const trainingInsertController = async (req, res) => {
    try {
        const {
            title,
            description,
            company,
            location,
            mode,
            stipend,
            duration,
            openings,
            eligibility,
            skills,
            lastDateToApply,
            status,
        } = req.body;

        console.log("Training body:", req.body);
        console.log("Training files:", req.files);

        let poster = "";

        if (req.files?.[0]) {
            const uploadResult = await uploadTrainingPosterToCloudinary(req.files[0].buffer);
            poster = uploadResult.secure_url;
        }

        const parsedStipend = stipend === "" || stipend == null ? 0 : Number(stipend);
        const parsedOpenings = openings === "" || openings == null ? 0 : Number(openings);

        if (Number.isNaN(parsedStipend) || Number.isNaN(parsedOpenings)) {
            return res.status(400).json({
                success: false,
                message: "Stipend and Openings must be valid numbers.",
            });
        }

        console.log("Creating training with:", {
            title,
            description,
            company,
            location,
            mode,
            stipend,
            duration,
            openings,
            eligibility,
            skills,
            lastDateToApply,
            status,
            poster,
        });

        const training = await Training.create({
            title,
            description,
            company,
            location,
            mode,
            stipend: parsedStipend,
            duration,
            openings: parsedOpenings,
            eligibility,
            skills: skills
                ? Array.isArray(skills)
                    ? skills
                    : skills.split(",").map((s) => s.trim())
                : [],
            lastDateToApply,
            status,
            poster,
        });

        return res.status(201).json({ success: true, message: "Training created successfully", training });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTrainingData = async (req, res) => {
    try {
        const trainings = await Training.find().sort({ createdAt: -1 });
        return res.json({ success: true, trainings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTrainingById = async (req, res) => {
    try {
        const training = await Training.findById(req.params.id);
        if (!training) return res.status(404).json({ success: false, message: "Training not found" });
        return res.json({ success: true, training });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const EditTrainingData = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.stipend !== undefined) {
            updateData.stipend = Number(updateData.stipend);
        }

        if (updateData.openings !== undefined) {
            updateData.openings = Number(updateData.openings);
        }

        if (Number.isNaN(updateData.stipend) || Number.isNaN(updateData.openings)) {
            return res.status(400).json({
                success: false,
                message: "Stipend and Openings must be valid numbers.",
            });
        }

        delete updateData.category;
        delete updateData.posterUrl;
        delete updateData._id;
        if (updateData.skills && !Array.isArray(updateData.skills)) {
            updateData.skills = updateData.skills.split(",").map((s) => s.trim());
        }

        const _id = req.body._id;
        if (!_id) {
            return res.status(400).json({ success: false, message: "Training id is required" });
        }
        const existingTraining = await Training.findById(_id);
        if (!existingTraining) return res.status(404).json({ success: false, message: "Training not found" });

        if (req.files?.[0]) {
            const uploadResult = await uploadTrainingPosterToCloudinary(req.files[0].buffer);
            updateData.poster = uploadResult.secure_url;
            if (existingTraining.poster) {
                await deleteTrainingPosterFromCloudinary(existingTraining.poster);
            }
        }

        const training = await Training.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true });
        return res.json({ success: true, message: "Training updated successfully", training });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const DeleteTraining = async (req, res) => {
    try {
        const training = await Training.findById(req.params.id);
        if (!training) return res.status(404).json({ success: false, message: "Training not found" });

        if (training.poster) {
            await deleteTrainingPosterFromCloudinary(training.poster);
        }

        await Training.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: "Training deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};