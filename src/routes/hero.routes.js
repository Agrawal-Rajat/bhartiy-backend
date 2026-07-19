import { heroInsertController,getHeroData,EditHeroData,DeleteHeroContent,HeroPosters } from "../newController/Hero/hero.controller.js";
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
const HeroRoute=Router()
HeroRoute.post("/insertherodata",verifyToken,HeroPosters,heroInsertController)
HeroRoute.get("/getherodata",getHeroData)
HeroRoute.put("/editherodata",verifyToken,HeroPosters,EditHeroData)
HeroRoute.delete("/deleteherodata/:id",verifyToken,DeleteHeroContent)

export{HeroRoute}