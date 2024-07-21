const express = require('express');
const router = express.Router(); 

// Import Controllers
const userSignupController = require('../controllers/userSignup');
router.post("/signup", userSignupController);

module.exports = router;