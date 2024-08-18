const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email:{
        type: String,
        unique: true,
        required: true
    },
    password: String,
    profilePic: String
},{
    timestamps: true
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;