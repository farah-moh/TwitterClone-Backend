const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');
const userController = require('./../controllers/userController');
const exploreController = require('./../controllers/exploreController');
const router = express.Router({ mergeParams: true });
router.use(authenticationController.protect);

router.get('/',exploreController.getHashtags);
router.get('/:hashtag',exploreController.getTrendingTweets);
module.exports = router;