const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');
const userController = require('./../controllers/userController');
const passportConfig = require('../config/passport');
// const fileUpload = require('express-fileupload');
const passport = require('passport');

const router = express.Router();

router.use(authenticationController.protect);

router.get('/profile',userController.getEditProfile);

module.exports = router;
