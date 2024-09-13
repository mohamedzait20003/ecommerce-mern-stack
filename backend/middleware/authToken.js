// Library Import
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

// Helper Import
const { decrypt } = require('../helpers/decrypt');

// Passport Configuration
const opts = {
    jwtFromRequest: ExtractJwt.fromExtractors([(req) => {
        const encryptedToken = req.cookies?.token;
        if (encryptedToken) {
          return decrypt(encryptedToken, process.env.COOKIE_ENCRYPTION_KEY);
        }
        return null;
    }]),
    secretOrKey: process.env.TOKEN_SECRET,
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    if (jwt_payload?._id) {
      return done(null, jwt_payload);
    } else {
      return done(null, false);
    }
}));

// Authentication Middleware
async function authToken(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        return res.json({
          message: err.message || err,
          data: [],
          error: true,
          success: false,
        });
      }
      if (!user) {
        return res.status(200).json({
          message: "User not Login",
          error: true,
          success: false,
        });
      }
      req.userId = user._id;
      next();
    })(req, res, next);
}

// Export Middleware
module.exports = authToken;