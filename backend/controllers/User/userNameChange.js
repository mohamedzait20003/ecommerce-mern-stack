// Model Import
const userModel = require("../../models/userModel");

// Controller
async function userNameChangeController(req,res){
    try{
        const { username } = req.body;

        const updateUser = await userModel.findByIdAndUpdate(
            req.userId,
            { username: username },
            { new: true }
        );

        if(!updateUser){
            throw new Error("User not found");
        }

        res.status(200).json({
            message : "Username changed Successfully!",
            success : true,
            error : false
        });
    }catch(err){
        res.json({
            message : err.message || err  ,
            error : true,
            success : false,
        });
    }
}

// Export Controller
module.exports = userNameChangeController;
