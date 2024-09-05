// Model
const userModel = require("../../models/userModel");

// Library Import
const bcrypt = require('bcryptjs');

// Controller
async function addUserController(req, res) {
    try {
        const { username, email, password, Role } = req.body;

        const user = await userModel.findOne({email});
        if(user){
            throw new Error("User already exists");
        }

        if(!email){
           throw new Error("Please provide email");
        }
        if(!password){
            throw new Error("Please provide password");
        }
        if(!username){
            throw new Error("Please provide name");
        }
        if(!Role){
            throw new Error("Please provide Role");
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = await bcrypt.hashSync(password, salt);

        if(!hashPassword){
            throw new Error("Something is wrong")
        }

        const payload = {
            ...req.body,
            password : hashPassword,
            phone: [],
            location: []
        };

        const userData = new userModel(payload);
        const saveUser = await userData.save();

        res.status(200).json({
            data: saveUser,
            message: "User Added",
            success: true,
            error: false,
        });

    } catch (err) {
        res.json({
            message: err.message || "Internal Server Error",
            error: true,
            success: false,
        });
    }
}

module.exports = addUserController;