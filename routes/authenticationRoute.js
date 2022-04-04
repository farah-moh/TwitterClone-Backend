const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');

const router = express.Router();

router.post('/signup', authenticationController.signUp);
router.post('/signup-confirm/:token', authenticationController.signUpConfirmed);

router.post('/login', authenticationController.login);
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