import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/AuthModel/admin.model.js";

// Middleware to verify JWT from HTTP-only cookie or Authorization header
const verifyToken = (req, res, next) => {
    let token = req.cookies?.token;

    if (!token && req.headers?.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
            token = parts[1];
        } else if (parts.length === 1) {
            token = parts[0];
        }
    }

    if (!token && req.headers?.["x-access-token"]) {
        token = req.headers["x-access-token"];
    }

    if (!token) {
        return res.status(401).send({
            message: "No token found in cookie or authorization header. Authorization denied.",
            success: false,
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("Decoded user:", req.user);
        next();
    } catch (error) {
        return res.status(401).send({
            message: "Invalid or expired token.",
            success: false,
        });
    }
};

// Middleware to ensure the authenticated user is strictly an Admin (admin or superadmin; NOT subadmin or regular user)
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
                success: false,
            });
        }

        let role = req.user.role;

        // If role not explicitly in token, check Admin model
        if (!role && req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
            const adminDoc = await Admin.findById(req.user.id);
            if (adminDoc) {
                role = adminDoc.role;
            }
        }

        if (role !== "admin" && role !== "superadmin") {
            return res.status(403).json({
                message: "Access denied. Only Admin can perform this action.",
                success: false,
            });
        }

        // Verify account exists and is not inactive in Admin collection
        if (req.user.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
            const adminDoc = await Admin.findById(req.user.id);
            if (adminDoc && adminDoc.status === "inactive") {
                return res.status(403).json({
                    message: "Access denied. Admin account is inactive.",
                    success: false,
                });
            }
        }

        next();
    } catch (error) {
        console.error("Admin verification error:", error);
        return res.status(500).json({
            message: "Server error verifying admin privileges.",
            success: false,
            error: error.message || error,
        });
    }
};

export { verifyToken, requireAdmin };

