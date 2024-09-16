// Model Import
const userModel = require("../../models/userModel");

// Library Import
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport Configuration
passport.use('google-link', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:8080/api/link-google/callback',
    passReqToCallback: true 
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);

        user.SocialLink.googleId = profile.id;
        user.LinkCheck.google = true;
        const saveUser = await user.save();

        done(null, saveUser);
    } catch (err) {
        done(err, null);
    }
}));

// Controller
exports.linkGoogleAccount = (req, res, next) => {
    passport.authenticate('google-link', {
        scope: ['profile'],
        state: req.userId
    })(req, res, next);
};

exports.linkGoogleAccountCallback = (req, res, next) => {
    passport.authenticate("google-link", (err, user, info) => {
        if (err) {
            res.cookie('status', 'failure', { httpOnly: false });
        }
        
        res.cookie('status', 'success', { httpOnly: false });
        res.redirect('http://localhost:3000/user-profile');
    })(req, res, next);
};