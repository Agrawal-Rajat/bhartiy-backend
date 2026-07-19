import { Router } from "express"
import { logoutController } from "../newController/auth/logout.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { GetUserById, loginController, UpdateUserStatus, GetAllUsers } from "../newController/auth/login.controller.js";
import { verify } from "../utils/verify.js";
import { SignUpController } from "../newController/auth/signup.controller.js";
import { userfiles, UserUpdateController } from "../newController/auth/update.controller.js";
import { StatsConuts } from "../newController/auth/stats.controller.js";
import { AdminloginController } from "../newController/auth/admin.login.controller.js";

const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.post("/adminlogin", AdminloginController);
authRouter.post("/signup", SignUpController);
authRouter.post("/verify", verifyToken, verify);
authRouter.post('/logout', verifyToken, logoutController)
authRouter.get("/getuserbyid/:id", GetUserById)
authRouter.get("/getcount", StatsConuts)
authRouter.put("/updateuser", verifyToken, userfiles, UserUpdateController)
authRouter.put("/updateuserstatus", verifyToken, UpdateUserStatus)
authRouter.get("/getallusers", verifyToken, GetAllUsers);


export { authRouter }