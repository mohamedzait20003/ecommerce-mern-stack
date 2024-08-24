const express = require('express');
const router = express.Router(); 

// Import Middleware
const authToken = require('../middleware/authToken');

// Import User Controllers
const userSignupController = require('../controllers/userSignup');
const userLoginController = require('../controllers/userLogin');
const userDetailsController = require('../controllers/userDetails');

// Import Logout Controller
const userLogoutController = require('../controllers/userLogout');

// Logout Route
router.get("/logout", userLogoutController);

// User Routes
router.post("/signup", userSignupController);
router.post("/login", userLoginController);
router.get("/user-details", authToken, userDetailsController);

module.exports = router;