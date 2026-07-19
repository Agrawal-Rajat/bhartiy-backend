import jwt from "jsonwebtoken";

// Middleware to verify JWT from HTTP-only cookie
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send({
            message: "No token found in the cookie. Authorization denied.",
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
