import dotenv from 'dotenv';
dotenv.config();

const logoutController = (req, res) => {
    // Clear cookie with exact attributes it was set with
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    });
    // Fallback clears for other browser environments
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    res.clearCookie("token");

    return res.status(200).send({
        message: "Successfully logged out",
        success: true,
    });
};

export { logoutController };
