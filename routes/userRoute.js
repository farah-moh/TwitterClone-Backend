const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');
const userController = require('./../controllers/userController');
const passportConfig = require('../config/passport');
const passport = require('passport');

const router = express.Router({mergeParams: true});

router.use(authenticationController.protect);

router.get('/',userController.getProfile);
router.get('/with_replies',userController.getProfileWithReplies);
router.get('/media',userController.getProfileMedia);
router.get('/likes',userController.getProfileLikes);

module.exports = router;