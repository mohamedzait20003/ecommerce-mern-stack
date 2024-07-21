const userModel = require("../models/userModel");
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
        
        if(checkPassword){
            const tokendata = {
                _id: user._id,
                email: user.email,
            }
            const token = await jwt.sign(tokendata, process.env.TOKEN_SECRET , { expiresIn: 60 * 60 * 8 });

            const tokenOption = {
                httpOnly: true,
                secure: true,
            }

            res.cookie("token", token.tokenOption).json({
                message: "Login success",
                data: token,
                error: false,
                success: true,
            });
        }
        else{
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