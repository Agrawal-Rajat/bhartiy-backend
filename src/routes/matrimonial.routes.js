import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  AddIntrest,
  GetMatrimonialProfileStatusById,
  GetMetrimonialData,
  GetMetrimonialProfileForAdmin,
  GetProfileLikers,
  updateStatusOfProfileLikers,
  insertMatrimonialProfile,
  DeleteMatrimonialProfile,
  DeleteBiodata,
} from "../newController/MatrimonialData/matrimonial.controller.js";

const MatrimonialRouter = Router();

const MatrimonialFiles = upload("matrimonial_files").fields([
  { name: "profile_photo", maxCount: 1 },
  { name: "biodata", maxCount: 1 },
]);

MatrimonialRouter.get("/getmatrimonialprofile", GetMetrimonialData);
MatrimonialRouter.post("/addmatrimonialintrest", verifyToken, AddIntrest);
MatrimonialRouter.get("/getmatrimonialprofileforadmin", verifyToken, GetMetrimonialProfileForAdmin);

MatrimonialRouter.post("/getprofileliker", verifyToken, GetProfileLikers);
MatrimonialRouter.post("/getprofilelikerbyid", verifyToken, GetMatrimonialProfileStatusById);
MatrimonialRouter.put("/updatestatusofprofilelikers", verifyToken, updateStatusOfProfileLikers);

MatrimonialRouter.post("/insertmatrimonialprofile", verifyToken, MatrimonialFiles, insertMatrimonialProfile);
MatrimonialRouter.delete("/deletematrimonialprofile/:id", verifyToken, DeleteMatrimonialProfile);
MatrimonialRouter.delete("/deletebiodata/:id", verifyToken, DeleteBiodata);

export { MatrimonialRouter };