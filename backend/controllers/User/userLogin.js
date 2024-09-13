// Model Import
const userModel = require("../../models/userModel");

// Library Import
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper Import
const { encrypt } = require('../../helpers/encrypt');

async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email) {
            throw new Error("Please provide email");
        }
        if (!password) {
            throw new Error("Please provide password");
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        
        if (checkPassword) {
            const tokenData = {
                _id: user._id,
                email: user.email,
            };

            const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "8h" });
            const tokenOption = {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            };

            const encryptionKey = process.env.COOKIE_ENCRYPTION_KEY;
            const encryptedToken = encrypt(token, encryptionKey);

            res.cookie("token", encryptedToken, tokenOption).status(200).json({
                message: "Login success",
                data: token,
                error: false,
                success: true,
            });
        } else {
            throw new Error("Password incorrect");
        }
    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        });
    }
}

module.exports = userLoginController;