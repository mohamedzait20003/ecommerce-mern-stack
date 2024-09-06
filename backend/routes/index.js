// Libraries
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
const userDeleteController = require('../controllers/User/userDelete');

// Import Admin Controllers
const showUsersController = require('../controllers/Admin/showUsers');
const addCoordinatorController = require('../controllers/Admin/addCoordinator');

// User Routes
router.post("/signup", userSignupController);
router.post("/login", userLoginController);
router.get("/user-details", authToken, userDetailsController);
router.get("/logout", userLogoutController);
router.put("/user-pic-change", userPicChangeController);
router.put("/user-pic-remove", userPicRemoveController);
router.put("/user-name-change", userNameChangeController);
router.post("/user-delete", userDeleteController);
router.put("/user-password-change", userPassChangeController);

// Admin Routes
router.get("/show-users", showUsersController);
router.post("/add-coordinator", addCoordinatorController);

module.exports = router;