// Model Import
const userModel = require("../../models/userModel");

// Controller
async function userDeleteController(req, res) {
    try{
        await userModel.findByIdAndDelete(req.userId);

        return res.json({ 
            success: true, 
            error: false,
            message: 'Account Deleted Successfully'
        });

    } catch (error) {
        return res.json({ 
            success: false, 
            error: true,
            message: 'Internal Server Error' 
        });
    }
}

// Export Controller
module.exports = userDeleteController;