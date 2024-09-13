// Model Import
const userModel = require("../../models/userModel");

// Controller
async function userPicRemoveController(req, res) {
    try {
        const { Id } = req.body;

        const updateUser = await userModel.findByIdAndUpdate(
            Id,
            { profilePic: "" },
            { new: true }
        );

        if (!updateUser) {
            throw new Error("Something is wrong");
        }

        res.status(200).json({
            message: "Picture Deleted Successfully!",
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
module.exports = userPicRemoveController;