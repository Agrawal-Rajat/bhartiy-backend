import { Router } from "express";
import { logoutController } from "../newController/auth/logout.controller.js";
import { verifyToken, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  GetUserById,
  loginController,
  UpdateUserStatus,
  GetAllUsers,
} from "../newController/auth/login.controller.js";
import { verify } from "../utils/verify.js";
import { SignUpController } from "../newController/auth/signup.controller.js";
import {
  userfiles,
  UserUpdateController,
} from "../newController/auth/update.controller.js";
import { StatsConuts } from "../newController/auth/stats.controller.js";
import { AdminloginController } from "../newController/auth/admin.login.controller.js";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetUserPassword,
} from "../newController/auth/forgotPassword.controller.js";
import { exportUsersToCsv } from "../newController/auth/exportUsers.controller.js";

const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.post("/adminlogin", AdminloginController);
authRouter.post("/signup", SignUpController);
authRouter.post("/verify", verifyToken, verify);
authRouter.post("/logout", logoutController);
authRouter.get("/getuserbyid/:id", GetUserById);
authRouter.get("/getcount", StatsConuts);
authRouter.put("/updateuser", verifyToken, userfiles, UserUpdateController);
authRouter.put("/updateuserstatus", verifyToken, UpdateUserStatus);

// Admin-only user management & export routes
authRouter.get("/getallusers", verifyToken, requireAdmin, GetAllUsers);
authRouter.get("/export-users-csv", verifyToken, requireAdmin, exportUsersToCsv);
authRouter.get("/exportuserscsv", verifyToken, requireAdmin, exportUsersToCsv);

// User-only forgot password & OTP reset flow
authRouter.post("/forgot-password/send-otp", sendForgotPasswordOtp);
authRouter.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
authRouter.post("/forgot-password/reset-password", resetUserPassword);

export { authRouter };

