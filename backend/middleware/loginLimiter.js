// Library Import
const rateLimit = require('express-rate-limit');

// Limit Login Request
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res) => {
        res.json({
            message: "Too many login attempts please try again after 15 minutes",
            error: true,
            success: false
        });
    }
});


// Export Middleware
module.exports = loginLimiter;