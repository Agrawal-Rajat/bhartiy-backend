import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { DeleteSavedSessions, EditSavedSessionData, getSavedSession, saveSession } from "../newController/SaveSessions/save.live.sessions.controller.js";
const SaveSessionRoute=Router()
SaveSessionRoute.post("/insertsavesessiondata",verifyToken,saveSession)
SaveSessionRoute.get("/getsavesessiondata",verifyToken,getSavedSession)
SaveSessionRoute.delete("/deletesavedsession/:id",verifyToken,DeleteSavedSessions)
SaveSessionRoute.put("/updatesavedsession",verifyToken, EditSavedSessionData);


export{SaveSessionRoute}