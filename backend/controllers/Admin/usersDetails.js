// Model Import
const userModel = require("../../models/userModel");

// Controller
async function usersDetails(req, res) {
    try {
        const users = await userModel.find({});

        if (!users) {
            throw new Error("No User Found");
        }

        res.status(200).json({
            message: "Users Details",
            success: true,
            error: false,
            data: users,
        });

    } catch (err) {
        res.json({
            message: err.message || "Internal Server Error",
            error: true,
            success: false,
        });
    }
}

module.exports = usersDetails;