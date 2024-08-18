const express = require('express');
const router = express.Router(); 

// Import Controllers
const userSignupController = require('../controllers/userSignup');
const userLoginController = require('../controllers/userLogin');
const userDetailsController = require('../controllers/userDetails');
const userLogoutController = require('../controllers/userLogout');

// Import Middleware
const authToken = require('../middleware/authToken');

// Routes
router.post("/signup", userSignupController);
router.post("/login", userLoginController);
router.get("/user-details", authToken, userDetailsController);
router.get("/logout", userLogoutController);

module.exports = router;