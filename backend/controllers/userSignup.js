const userModel = require('../models/userModel');

const userSignupController = async (req, res) => {
    try{
        const { username, email, password } = req.body;

        if(!username){
            throw new Error('Username is required');
        }
        if(!email){
            throw new Error('Email is required');
        }
        if(!password){
            throw new Error('Password is required');
        }

        const userData = new userModel(req.body);

    }catch(err){
        res.status(500).json({
            message: err,
            error: true,
            success: false,
        });
    }
};