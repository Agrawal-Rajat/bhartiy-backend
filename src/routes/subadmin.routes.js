import { Router } from "express";
import {
  createSubAdmin,
  getAllSubAdmins,
  deleteSubAdmin,
  toggleSubAdminStatus,
} from "../newController/SubAdmin/subadmin.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

// Helper middleware to ensure only primary admin can manage sub-admins
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "subadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only primary admin can manage sub-admins.",
    });
  }
  next();
};

const SubAdminRoute = Router();

SubAdminRoute.post("/create", verifyToken, requireAdmin, createSubAdmin);
SubAdminRoute.get("/getall", verifyToken, requireAdmin, getAllSubAdmins);
SubAdminRoute.delete("/delete/:id", verifyToken, requireAdmin, deleteSubAdmin);
SubAdminRoute.put("/toggle-status/:id", verifyToken, requireAdmin, toggleSubAdminStatus);

export { SubAdminRoute };
