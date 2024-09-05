const express = require('express');
const router = express.Router(); 

// Import Middleware
const authToken = require('../middleware/authToken');

// Import User Controllers
const userSignupController = require('../controllers/User/userSignup');
const userLoginController = require('../controllers/User/userLogin');
const userDetailsController = require('../controllers/User/userDetails');
const userLogoutController = require('../controllers/User/userLogout');

// Import User Profile Controllers
const userPicChangeController = require('../controllers/User/userPicChange');
const userPicRemoveController = require('../controllers/User/userPicRemove');
const userNameChangeController = require('../controllers/User/userNameChange');
const userPassChangeController = require('../controllers/User/userPassChange');

// Import Admin Controllers
const usersDetailsController = require('../controllers/Admin/usersDetails');

// User Routes
router.post("/signup", userSignupController);
router.post("/login", userLoginController);
router.get("/logout", userLogoutController);
router.post("/user-pic-change", userPicChangeController);
router.post("/user-pic-remove", userPicRemoveController);
router.post("/user-name-change", userNameChangeController);
router.post("/user-password-change", userPassChangeController);
router.get("/user-details", authToken, userDetailsController);

// Admin Routes
router.get("/users-details", usersDetailsController);

module.exports = router;