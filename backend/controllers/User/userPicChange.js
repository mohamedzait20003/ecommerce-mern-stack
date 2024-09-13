// Model Import
const userModel = require("../../models/userModel");

// Controller
async function userPicChangeController(req, res) {
    try {
        const { Id, profilePic } = req.body;

        if (!profilePic) {
            throw new Error("Pic is required");
        }

        const updateUser = await userModel.findByIdAndUpdate(
            Id,
            { profilePic: profilePic },
            { new: true }
        );

        if (!updateUser) {
            throw new Error("Something is wrong");
        }

        res.status(200).json({
            message: "Picture changed Successfully!",
            success: true,
            error: false,
        });

    } catch (err) {
        res.json({
            message: err.message || "Internal Server Error",
            error: true,
            success: false,
        });
    }
}

// Export Controller
module.exports = userPicChangeController;