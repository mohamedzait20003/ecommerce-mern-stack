// Model Import
const userModel = require("../../models/userModel");

// Library Import
const passport = require('passport');
const jwt = require('jsonwebtoken');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Helper Import
const { encrypt } = require('../../helpers/encrypt');

// Passport Configuration
passport.use('google-login', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/google-login/callback'
  },
  async (profile, done) => {
    try {
        let user = await userModel.findOne({ googleId: profile.id });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// Controller
exports.googleLogin = passport.authenticate('google-login', { scope: ['profile'] });

exports.googleLoginCallback = async (req, res) => {
    try{
        const user = await User.findOne({ googleId: req.user.id });
        if (user) {
            const tokenData = {
                _id: user._id,
                email: user.email,
            };

            const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: 60 * 60 * 8 });
            const tokenOption = {
                httpOnly: true,
                secure: true,
            };

            const encryptionKey = process.env.COOKIE_ENCRYPTION_KEY;
            const encryptedToken = encrypt(token, encryptionKey);

            res.cookie("token", encryptedToken, tokenOption).status(200).json({
                message: "Login success",
                data: token,
                error: false,
                success: true,
            });
        } else {
            throw new Error("User not found");
        }
    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false,
        });
    } 
};