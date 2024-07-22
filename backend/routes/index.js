const express = require('express');
const router = express.Router(); 

// Import Controllers
const userSignupController = require('../controllers/userSignup');
const userLoginController = require('../controllers/userLogin');
const userDetailsController = require('../controllers/userDetails');

// Import Middleware
const authToken = require('../middleware/authToken');

// Routes
router.post("/signup", userSignupController);
router.post("/login", userLoginController);
router.get("/user-details",authToken,userDetailsController)

module.exports = router;