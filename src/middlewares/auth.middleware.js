import jwt from "jsonwebtoken";

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

export { verifyToken };
