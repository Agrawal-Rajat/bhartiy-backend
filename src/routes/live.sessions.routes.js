import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getSession, insertSession } from "../newController/LiveSessionController/live_session.controller.js";
const LiveSessionRoute=Router()
LiveSessionRoute.post("/insertsessiondata",verifyToken,insertSession)
LiveSessionRoute.get("/getsessiondata",getSession)

export{LiveSessionRoute}