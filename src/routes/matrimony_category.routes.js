import { Router } from "express";
import {
  insertMatrimonyCategory,
  EditMatrimonyCategory,
  DeleteMatrimonyCategory,
  getMatrimonyCategory,
} from "../newController/MatrimonyCategory/matrimony.category.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const MatrimonyCategoryRoute = Router();

MatrimonyCategoryRoute.post("/insertmatrimonycategory", verifyToken, insertMatrimonyCategory);
MatrimonyCategoryRoute.get("/getmatrimonycategory", getMatrimonyCategory);
MatrimonyCategoryRoute.put("/editmatrimonycategory", verifyToken, EditMatrimonyCategory);
MatrimonyCategoryRoute.delete("/deletematrimonycategory/:id", verifyToken, DeleteMatrimonyCategory);

export { MatrimonyCategoryRoute };
