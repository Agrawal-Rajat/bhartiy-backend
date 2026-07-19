import { DeleteJobCategory, EditJobCategory, getJobCategory, insertJobCategory } from "../newController/jobCategory/job_category.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { Router } from "express";
const JobCategoryRoute=Router()
JobCategoryRoute.post("/insertjobcategory",verifyToken,insertJobCategory)
JobCategoryRoute.get("/getjobcategory",getJobCategory)
JobCategoryRoute.put("/editjobcategory",verifyToken,EditJobCategory)
JobCategoryRoute.delete("/deletejobcategory/:id",verifyToken,DeleteJobCategory)

export{JobCategoryRoute}