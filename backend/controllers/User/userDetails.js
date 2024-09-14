// Model Import
const userModel = require("../../models/userModel");

// Controller
async function userDetailsController(req, res) {
    try{
        const user = await userModel.findById(req.userId).select('-password -SocialLink -createdAt -updatedAt -__v');
        res.status(200).json({
            data: user,
            error: false,
            success: true,
            message: "User Details"
        });
    } catch (err){
        res.status(400).json({
            message: err.message || err,
            error: true,
            succes: false
        });
    }
}

// Export Controller
module.exports = userDetailsController;