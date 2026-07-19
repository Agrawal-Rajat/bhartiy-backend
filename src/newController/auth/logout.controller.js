import dotenv from 'dotenv';
dotenv.config();
const logoutController = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(200).send({
        message: "Successfully logged out",
        success: true,
    });
};

export { logoutController };
