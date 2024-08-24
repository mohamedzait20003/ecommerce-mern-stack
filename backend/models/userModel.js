const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    Role: String,
    profilePic: String,
    phone: [
        {
            type: Number,
        }
    ],
    location: [
        {
            address: String,
            city: String,
            long: Number,
            lat: Number,
        }
    ]
}, {
    timestamps: true
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;