// Library Import
const jwt = require('jsonwebtoken');

// Helper Import
const { decrypt } = require('../helpers/decrypt');

async function authToken(req, res, next) {
    try{
        const encryptedToken = req.cookies?.token;

        if(!encryptedToken) {
            return res.status(200).json({
                message: "User not Login",
                error: true,
                success: false
            });
        }

        const token = decrypt(encryptedToken, process.env.COOKIE_ENCRYPTION_KEY);
        jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
            req.userId = decoded?._id;
            next();
        })
    } catch (err){
        res.status(400).json({
            message: err.message || err,
            data: [],
            error: true,
            succes: false
        });
    }
}

module.exports = authToken;