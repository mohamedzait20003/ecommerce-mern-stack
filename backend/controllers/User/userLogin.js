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
            const AccessTokenData = {
                _id: user._id,
                email: user.email,
            };

            const accessToken = await jwt.sign(AccessTokenData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
            const encryptedaccessToken = encrypt(accessToken, process.env.COOKIE_ENCRYPTION_KEY);
            const tokenOption = {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            };

            res.cookie("accessToken", encryptedaccessToken, tokenOption);

            res.status(200).json({
                message: "Login success",
                accessToken: accessToken,
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

// Export Controller
module.exports = userLoginController;