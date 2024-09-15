// Model Import
const userModel = require("../../models/userModel");

// Library Import
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
            const RefreshTokenData = {
                _id: user._id,
                email: user.email,
            };
            const AccessTokenData = {
                key: crypto.randomBytes(64).toString('hex'),
                role: user.Role,
            }

            const accessToken = await jwt.sign(AccessTokenData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
            const refreshToken = await jwt.sign(RefreshTokenData, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
            
            const tokenOption = {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            };

            res.cookie("refreshToken", refreshToken, tokenOption);

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