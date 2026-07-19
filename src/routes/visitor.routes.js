import express from "express";
import {
    getVisitorCount,
    registerVisitor,
} from "../newController/Visitor/visitor.controller.js";

const router = express.Router();

// Get total visitor count
router.get("/", getVisitorCount);

// Register a visitor
router.post("/", registerVisitor);

export { router as VisitorRoute };