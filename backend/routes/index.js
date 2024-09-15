// Libraries
const express = require('express');
const router = express.Router(); 

// Import Middleware
const authToken = require('../middleware/authToken');
const loginLimiter = require('../middleware/loginLimiter');

// Import User Controllers
const userSignupController = require('../controllers/User/userSignup');
const userLoginController = require('../controllers/User/userLogin');
const userDetailsController = require('../controllers/User/userDetails');
const userRefreshController = require('../controllers/User/userRefresh');
const userLogoutController = require('../controllers/User/userLogout');

// Import User Profile Controllers
const userPicChangeController = require('../controllers/User/userPicChange');
const userPicRemoveController = require('../controllers/User/userPicRemove');
const userNameChangeController = require('../controllers/User/userNameChange');
const userPassChangeController = require('../controllers/User/userPassChange');
const userDeleteController = require('../controllers/User/userDelete');

// Import User Google OAuth Controllers
const userGoogleLinkController = require('../controllers/User/userGoogleLink');
const userGoogleLoginController = require('../controllers/User/userGoogleLogin');

// Import Admin Controllers
const showUsersController = require('../controllers/Admin/showUsers');
const addCoordinatorController = require('../controllers/Admin/addCoordinator');

// User Routes
router.post("/signup", userSignupController);
router.post("/login", loginLimiter, userLoginController);
router.get("/user-details", authToken, userDetailsController);
router.get("/refresh", authToken, userRefreshController);
router.get("/logout", userLogoutController);

// User Profile Routes
router.put("/user-pic-change", authToken, userPicChangeController);
router.put("/user-pic-remove", authToken, userPicRemoveController);
router.put("/user-name-change", authToken, userNameChangeController);
router.post("/user-delete", authToken, userDeleteController);
router.put("/user-password-change", authToken, userPassChangeController);

// User Google OAuth Routes
router.get('/link-google', userGoogleLinkController.linkGoogleAccount);
router.get('/link-google/callback', userGoogleLinkController.linkGoogleAccountCallback);
router.get('/login-google', userGoogleLoginController.googleLogin);
router.get('/login-google/callback', userGoogleLoginController.googleLoginCallback);

// Admin Routes
router.get("/show-users", showUsersController);
router.post("/add-coordinator", addCoordinatorController);

module.exports = router;