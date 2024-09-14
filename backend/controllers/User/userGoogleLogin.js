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
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await userModel.findOne({ googleId: profile.id });

        const tokenData = {
            _id: user._id,
            email: user.email,
        };

        const token = jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: '8h' });

        const encryptionKey = process.env.COOKIE_ENCRYPTION_KEY;
        const encryptedToken = encrypt(token, encryptionKey);

        done(null, { token: encryptedToken });
    } catch (err) {
        done(err, null);
    }
}));

// Controller
exports.googleLogin = passport.authenticate('google-login', { scope: ['profile', 'email'] });

exports.googleLoginCallback = (req, res) => {
    passport.authenticate('google-login', (err, data) => {
        const { token } = data;

        const tokenOption = {
            httpOnly: true,
            secure: true,
        };

        res.cookie("accessToken", token, tokenOption);
        res.redirect('http://localhost:3000');
    })(req, res);
};