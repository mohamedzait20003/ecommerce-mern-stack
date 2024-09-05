// Model
const userModel = require("../../models/userModel");

// Controller
async function userDeleteController(req, res) {
    try{
        const { Id } = req.body;
        await userModel.findByIdAndDelete(Id);

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

module.exports = userDeleteController;