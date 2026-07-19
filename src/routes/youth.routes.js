import { YouthPosters,youthInsertController,EditYouthData,DeleteYouthContent,getYouthData } from "../newController/Youth/youth.controller.js";
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
const YouthRoute=Router()
YouthRoute.post("/insertyouthdata",verifyToken,YouthPosters,youthInsertController)
YouthRoute.get("/getyouthdata",getYouthData)
YouthRoute.put("/edityouthdata",verifyToken,YouthPosters,EditYouthData)
YouthRoute.delete("/deleteyouthdata/:id",verifyToken,DeleteYouthContent)

export{YouthRoute}