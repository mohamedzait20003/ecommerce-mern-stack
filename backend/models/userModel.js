// Libraries
const mongoose = require('mongoose');

// Schema
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
    ],
    SocialLink: {
        googleId: String,
        facebookId: String,
    },
    LinkCheck: {
        google: Boolean,
        facebook: Boolean,
    }
}, {
    timestamps: true
});

// Model
const userModel = mongoose.model('User', userSchema);

module.exports = userModel;