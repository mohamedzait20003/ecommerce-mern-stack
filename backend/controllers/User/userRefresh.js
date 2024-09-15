// Model Import
const userModel = require("../../models/userModel");

// Library Import
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Controller
async function userRefreshController(req, res) {
    try {
        const user = await userModel.findById(req.userId).select('Role');
        const AccessTokenData = {
            key: crypto.randomBytes(64).toString('hex'),
            role: user.Role,
        }

        const accessToken = await jwt.sign(AccessTokenData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        console.log("Access Token:", accessToken);
        res.status(200).json({
            message: "Token Refreshed",
            accessToken: accessToken,
            error: false,
            success: true,
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
module.exports = userRefreshController;

