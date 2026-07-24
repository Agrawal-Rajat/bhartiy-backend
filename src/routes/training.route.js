import { Router } from "express";
import {
    DeleteTraining,
    EditTrainingData,
    getTrainingData,
    trainingInsertController,
    TrainingPosters,
} from "../newController/Training/training.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const TrainingRoute = Router();

TrainingRoute.post(
    "/inserttraining",
    verifyToken,
    TrainingPosters,
    trainingInsertController
);

TrainingRoute.get(
    "/gettrainings",
    getTrainingData
);

TrainingRoute.put(
    "/edittraining",
    verifyToken,
    TrainingPosters,
    EditTrainingData
);

TrainingRoute.delete(
    "/deletetraining/:id",
    verifyToken,
    DeleteTraining
);

export { TrainingRoute };
