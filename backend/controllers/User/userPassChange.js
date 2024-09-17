// Model Import
const userModel = require("../../models/userModel");

// Library Import
const bcrypt = require('bcryptjs');

// Helper Function
const decryption = require('../../helpers/decryption');

// Controller
async function userPassChangeController(req, res) {
    try {
        const { Oldpass, password } = req.body;

        // Decrypt the Old Password
        const oldPassword = decryption(Oldpass);
        console.log("oldPassword:", oldPassword);

        // Decrypt the New Password
        const newPassword = decryption(password);
        console.log("newPassword:", newPassword);

        // // Fetch the user by ID
        // const user = await userModel.findById(req.userId);

        // // Check if the old password is correct
        // const checkPassword = await bcrypt.compare(Oldpass, user.password);
        // if (!checkPassword) {
        //     throw new Error("Old Password incorrect");
        // }

        // // Generate a new hashed password
        // const salt = bcrypt.genSaltSync(10);
        // const hashPassword = await bcrypt.hashSync(password, salt);

        // // Update the user's password
        // const updateUser = await userModel.findByIdAndUpdate(
        //     req.userId,
        //     { password: hashPassword },
        //     { new: true }
        // );

        res.status(200).json({
            message: "Password changed Successfully!",
            success: true,
            error: false
        });
    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        });
    }
}

// Export Controller
module.exports = userPassChangeController;