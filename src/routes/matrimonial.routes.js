import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { AddIntrest, GetMatrimonialProfileStatusById, GetMetrimonialData, GetMetrimonialProfileForAdmin, GetProfileLikers, updateStatusOfProfileLikers } from "../newController/MatrimonialData/matrimonial.controller.js";

const MatrimonialRouter = Router();

MatrimonialRouter.get("/getmatrimonialprofile", GetMetrimonialData);
MatrimonialRouter.post("/addmatrimonialintrest",verifyToken, AddIntrest);
MatrimonialRouter.get("/getmatrimonialprofileforadmin",verifyToken, GetMetrimonialProfileForAdmin);

MatrimonialRouter.post("/getprofileliker",verifyToken, GetProfileLikers);
MatrimonialRouter.post("/getprofilelikerbyid",verifyToken, GetMatrimonialProfileStatusById);
MatrimonialRouter.put("/updatestatusofprofilelikers",verifyToken, updateStatusOfProfileLikers);
export { MatrimonialRouter }