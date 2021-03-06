const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');
const userController = require('./../controllers/userController');
const settingsController = require('./../controllers/settings');
const passportConfig = require('../config/passport');
// const fileUpload = require('express-fileupload');
const passport = require('passport');
const fileUpload = require('express-fileupload');

const router = express.Router();

router.use(authenticationController.protect);

router.get('/profile',userController.getEditProfile);
router.patch('/profile',fileUpload(),userController.editProfile);
router.patch('/Account-info/Email',settingsController.updateEmail);
router.patch('/Account-info/Username',settingsController.updateUsername);
router.patch('/Account-info/Password',settingsController.changePassword);
router.patch('/Account-info/Protected-tweets',settingsController.protectTweets);
router.patch('/Notifications',settingsController.pushNotifications);
router.patch('/Display',settingsController.changeTheme);
router.patch('/Deactivate-account',settingsController.deactivateAccount);
module.exports = router;
