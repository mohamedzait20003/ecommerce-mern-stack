// Controller
async function userLogoutController(req, res){
    try{
        res.clearCookie('token');
        res.status(200).json({
            message: "Logged Out Successfully",
            data: [],
            error: false,
            success: true
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