const express = require('express');
const router = express.Router(); 

// Import Middleware
const authToken = require('../middleware/authToken');

// Import User Controllers
const userSignupController = require('../controllers/User/userSignup');
const userLoginController = require('../controllers/User/userLogin');
const userDetailsController = require('../controllers/User/userDetails');

// Import Logout Controller
const userLogoutController = require('../controllers/User/userLogout');

// Logout Route
router.get("/logout", userLogoutController);

// User Routes
router.post("/signup", userSignupController);
router.post("/login", userLoginController);
router.get("/user-details", authToken, userDetailsController);

module.exports = router;