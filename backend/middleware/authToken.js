// Library Import
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

// Passport Configuration
const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([(req) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      return refreshToken;
    }
    return null;
  }]),
  secretOrKey: process.env.REFRESH_TOKEN_SECRET,
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
      return res.json({
        message: "Unauthorized",
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