import mongoose from "mongoose";
import dotenv from "dotenv";
import { createAdmin } from "../newController/auth/admin.login.controller.js";

dotenv.config();

try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    await createAdmin();
} catch (error) {
    console.error("Admin script failed:", error);
} finally {
    await mongoose.disconnect();
    process.exit(0);
}