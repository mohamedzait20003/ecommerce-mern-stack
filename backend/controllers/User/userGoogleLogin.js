// Model Import
const userModel = require("../../models/userModel");

// Library Import
const passport = require('passport');
const jwt = require('jsonwebtoken');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport Configuration
passport.use('google-login', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/google-login/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await userModel.findOne({ googleId: profile.id });

        const RefreshTokenData = {
            _id: user._id,
            email: user.email,
        };

        const refreshToken = await jwt.sign(RefreshTokenData, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        
        done(null, { refreshToken: refreshToken });
    } catch (err) {
        done(err, null);
    }
}));

// Controller
exports.googleLogin = passport.authenticate('google-login', { scope: ['profile', 'email'] });

exports.googleLoginCallback = (req, res) => {
    passport.authenticate('google-login', (err, data) => {
        const { refreshToken } = data;

        const tokenOption = {
            httpOnly: true,
            secure: true,
        };

        res.cookie("refreshToken", refreshToken, tokenOption);
        res.redirect('http://localhost:3000');
    })(req, res);
};