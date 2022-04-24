const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');


/**
 * @description - Takes user ID and and returns its info
 * @param {Object} userId - The user's ID
 * @returns {Object} User object
 */
const getProfile = async (userId) => {
    const userProfile = await user.findById(userId);
    // console.log('farah');
    const followingCount = userProfile.following.length;
    const followersCount = userProfile.followers.length;

    const returnedUser = (({ username, name, birthdate, tweets, protectedTweets }) => ({ username, name, birthdate, tweets, protectedTweets }))(userProfile);
    returnedUser["followingCount"] = followingCount;
    returnedUser["followersCount"] = followersCount;
    return returnedUser;
};

/*
1- get my id
2- check follows me
3- check protected
*/
/**
 * @description - compares the ID of the sent user and the token id and return the correct data
 * @param {string} notMeId - The ID of the sent user
 * @param {string} meId - The ID of the token user
 * @returns {Object} The correct user data
 */
const getUser = async (notMeId,meId)  => {

    //getting profile
    let notMe = await getProfile(notMeId);

    //checking if I am following user
    let mutuals = await user.findById(meId).select('following');
    mutuals = mutuals.following.find(x => x._id === notMeId);

    //checking if user follows me
    let followsMeProp = await user.findById(meId).select('followers');
    followsMeProp = followsMeProp.followers.find(x => x._id === notMeId);

    //checking if their profile is protected
    let protectedNotMe = notMe.protectedTweets;
    
    let followsMe = followsMeProp? true:false;
    notMe["followsMe"] = followsMe;
    let returnedUser;
    
    //if private user & I don't follow him, don't send tweets
    if(protectedNotMe && !mutuals) {
        //removing tweets from returnedUser
        returnedUser = 
        (({ username, name, birthdate, followingCount, followersCount, followsMe}) => 
        ({ username, name, birthdate,followingCount, followersCount, followsMe}))(notMe);
        //returnedUser = await notMe.select('-tweets');
    }
    else {
        returnedUser = notMe;
    }
    return returnedUser;
};
/**
 * @description - takes user Token id and returns its user
 * @param {string} meId - The ID of the token user
 * @returns {Object} user object
 */
const getMe = async meId => {
    const me = await getProfile(meId);
    return me;
};

exports.getProfile = catchAsync(async (req, res, next) => {
    //getting user in route params
    const sentUser = req.params.username;
    let sentUserId = await user.findOne({'username': sentUser}).select('_id');
    if(!sentUserId) return next(new AppError('This username does not exists.',401));
    sentUserId = sentUserId._id.toString();

    //getting my id from req user (protect)
    const meId = req.user.id;
    let me = await user.findById(meId).select('username');
    me = me.username;

    let currentUser;
    //checking if I am visiting my profile, or another user's profile
    if(me === sentUser) {
        currentUser = await getMe(meId);
    }
    else {
        currentUser = await getUser(sentUserId,meId);
    }

    res.status(200).json(currentUser);
});
/**
 * @description - Takes user ID and returns the correct data for edit profile
 * @param {string} userId - The user ID
 * @returns {Object} user object
 */
const getEditProfile = async (userId) => {
    const userProfile = await user.findById(userId).select('image headerImage name bio country city website birthdate');
    return userProfile;
};

exports.getEditProfile = catchAsync(async (req, res, next) => {
    const userProfile = await getEditProfile(req.user.id);
    res.status(200).json(userProfile);
});

/**
 * @description - Update the profile data
 * @param {string} userId - The user ID
 * @param {string} newInfo - The body containing the new info
 * @returns {Object} user object
 */
const editProfile = async (userId, newInfo) => {

    const editedUser = await user.findByIdAndUpdate(userId, newInfo, {
        new: true
      });
    if (!editedUser) throw new AppError('No user with this id', 404);
    return editedUser;
};

exports.editProfile = catchAsync(async (req, res, next) => {
    const editedUser = await editProfile(req.user._id, req.body);
    res.status(200).json(editedUser);
  });



  