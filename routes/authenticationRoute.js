const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');
const passport = require('../config/passport');


const router = express.Router();

router.post('/signup', authenticationController.signUp);
router.get('/signup-confirm/:token', authenticationController.signUpConfirmed);

router.post('/login', authenticationController.login);
router.post('/facebook', passport.authenticate('facebook-token', { session: false }), authenticationController.loginWithFacebook)

router.post('/forgot-password', authenticationController.forgotPassword);
router.patch('/reset-password/:token', authenticationController.resetPassword);
router.patch('/change-password', authenticationController.changePassword);

//router.get('/logout', authenticationController.logout);
// router.get(
//   '/token',
//   authenticationController.protect,
//   authenticationController.getToken
// );
// router.post('/forgotPassword', authenticationController.forgotPassword);
// router.patch('/resetPassword/:token', authenticationController.resetPassword);
// router.patch(
//   '/updatePassword',
//   authenticationController.protect,
//   authenticationController.updatePassword
// );
module.exports = router;