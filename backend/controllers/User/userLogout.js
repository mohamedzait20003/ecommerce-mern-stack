// Controller
async function userLogoutController(req, res){
    try {
        const tokenOption = {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        };

        res.clearCookie("accessToken", tokenOption);

        res.status(200).json({
            message: "Logout successful",
            error: false,
            success: true,
        });
    } catch (err) {
        res.status(400).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

// Export Controller
module.exports = userLogoutController;