import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { homeInsertController,EditHomeData,getHomeBannerData,HomePosters,DeleteHomeContent } from "../newController/HomeBanner/home.controller.js";
const HomeRoute=Router()
HomeRoute.post("/inserthomedata",verifyToken,HomePosters,homeInsertController)
HomeRoute.get("/gethomedata",getHomeBannerData)
HomeRoute.put("/edithomedata",verifyToken,HomePosters,EditHomeData)
HomeRoute.delete("/deletehomedata/:id",verifyToken,DeleteHomeContent)

export{HomeRoute}