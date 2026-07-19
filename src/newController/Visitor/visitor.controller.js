

import Visitor from "../../models/VistorModel/visitor.model.js";

// Track visitor by IP and return total unique visitor count
export const registerVisitor = async (req, res) => {
    try {
        const forwardedFor = req.headers["x-forwarded-for"];
        const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim()
            : req.ip || req.socket.remoteAddress;

        await Visitor.updateOne(
            { visitorId: ipAddress },
            { $setOnInsert: { visitorId: ipAddress } },
            { upsert: true }
        );

        const count = await Visitor.countDocuments();

        return res.status(200).json({
            success: true,
            count,
        });
    } catch (error) {
        console.error("Track visitor error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to track visitor",
        });
    }
};

// Get total unique visitor count
export const getVisitorCount = async (req, res) => {
    try {
        const count = await Visitor.countDocuments();

        return res.status(200).json({
            success: true,
            count,
        });
    } catch (error) {
        console.error("Get visitor count error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get visitor count",
        });
    }
};