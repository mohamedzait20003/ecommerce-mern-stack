// Library Import
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

// Helper Import
const { decrypt } = require('../helpers/decrypt');

// Passport Configuration
const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([(req) => {
    const encryptedToken = req.cookies?.accessToken;
    if (encryptedToken) {
      try {
        const decryptedToken = decrypt(encryptedToken, process.env.COOKIE_ENCRYPTION_KEY);
        return decryptedToken;
      } catch (error) {
        return null;
      }
    }
    return null;
  }]),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
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
          error: true,
          success: false,
        });
      }

      if (!user) {
        const tokenOption = {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict'
        };

        res.clearCookie("accessToken", tokenOption);
      }
      req.userId = user._id;
      next();
    })(req, res, next);
}

// Export Middleware
module.exports = authToken;