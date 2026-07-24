import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    ApplyToTraining,
    GetTrainingApplicantById,
    GetTrainingApplicants,
    updateStatus,
} from "../newController/Training/training_apply.controller.js";

const TrainingApplyRouter = Router();

TrainingApplyRouter.post("/applytotraining", verifyToken, ApplyToTraining);
TrainingApplyRouter.post("/gettrainingapplicants", verifyToken, GetTrainingApplicants);
TrainingApplyRouter.post("/gettrainingapplicantbyid", verifyToken, GetTrainingApplicantById);
TrainingApplyRouter.put("/updatestatus", verifyToken, updateStatus);

export { TrainingApplyRouter };