const jwt = require('jsonwebtoken');

async function authToken(req, res, next) {
    try {
        // Log cookies and headers for debugging
        console.log("Cookies:", req.cookies);
        console.log("Authorization Header:", req.headers['authorization']);

        const token = req.cookies?.token;
        console.log("Raw token:", token);

        if (!token || token === 'undefined') {
            return res.status(401).json({
                message: "Access Denied. No token provided.",
                data: [],
                error: true,
                success: false
            });
        }

        // If token is from the Authorization header, it might be in the format "Bearer <token>"
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trim();
        }

        console.log("Formatted token:", token);

        jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log("JWT Verification Error:", err);
                return res.status(400).json({
                    message: "Invalid token.",
                    data: [],
                    error: true,
                    success: false
                });
            }

            console.log("Decoded:", decoded);
            req.user = { id: decoded._id };
            next();
        });

    } catch (err) {
        res.status(400).json({
            message: err.message || err,
            data: [],
            error: true,
            success: false
        });
    }
};

module.exports = authToken;