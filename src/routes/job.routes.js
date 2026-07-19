import { DeleteJob, EditJobsData, getJobsData, jobInsertController,JobPosters } from "../newController/Jobs/job.controller.js";
import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
const JobRoute=Router()
JobRoute.post("/insertjob",verifyToken,JobPosters,jobInsertController)
JobRoute.get("/getjobs",getJobsData)
JobRoute.put("/editjob",verifyToken,JobPosters,EditJobsData)
JobRoute.delete("/deletejob/:id",verifyToken,DeleteJob)

export{JobRoute}