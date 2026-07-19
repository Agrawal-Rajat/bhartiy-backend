import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js";
import { ApplyToJob, GetJobAppilcantById, GetJobAppilcants, updateStatus } from "../newController/JobApply/job_apply.controller.js";

const JobApplyRouter = Router();

JobApplyRouter.post("/applytojob",verifyToken, ApplyToJob);
JobApplyRouter.post("/getjobapplicants",verifyToken, GetJobAppilcants);
JobApplyRouter.post("/getjobapplicantbyid",verifyToken, GetJobAppilcantById);
JobApplyRouter.put("/updatestatus",verifyToken, updateStatus);


export { JobApplyRouter }