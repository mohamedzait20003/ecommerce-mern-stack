// Model Import
const userModel = require("../../models/userModel");

// Library Import
const bcrypt = require('bcryptjs');

// Controller
async function userPassChangeController(req,res){
    try{
        const { Id, Oldpass, password } = req.body;

        const user = await userModel.findById(Id);
        if(!user){
            throw new Error("User not found");
        }

        const checkPassword = await bcrypt.compare(Oldpass, user.password);
        if(!checkPassword){
           throw new Error("Old Password incorrect");
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = await bcrypt.hashSync(password, salt);

        if(!hashPassword){
            throw new Error("Something is wrong")
        }

        const updateUser = await userModel.findByIdAndUpdate(
            Id,
            { password: hashPassword },
            { new: true }
        );

        if(!updateUser){
            throw new Error("Something is wrong");
        }

        res.status(200).json({
            message : "Password changed Successfully!",
            success : true,
            error : false
        });
    } catch (err){
        res.json({
            message : err.message || err,
            error : true,
            success : false,
        });
    }
};

module.exports = userPassChangeController;