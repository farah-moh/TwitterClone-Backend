const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');



const getProfile = async (userId) => {
    const userProfile = await user.findById(userId);
    const followingCount = userProfile.following.length;
    const followersCount = userProfile.followers.length;

    const returnedUser = (({ username, name, birthdate, tweets }) => ({ username, name, birthdate, tweets }))(userProfile);
    returnedUser["followingCount"] = followingCount;
    returnedUser["followersCount"] = followersCount;
    return returnedUser;
};

/*
1- get my id
2- check follows me
3- check protected
*/

const getUser = async username  => {
    const notMeId = user.find({'username': username}).select(_id);
    const notMe = await getProfile(notMeId);
    const mutuals = user.findById(req.user.id).select(following).following.find(x => x._id === notMeId);
    const followsMe = user.findById(req.user.id).select(followers).followers.find(x => x._id === notMeId);
    const protected = notMe.protectedTweets;
    let returnedUser;
    if(protected && !mutuals) {
        returnedUser = 
        (({ username, name, birthdate, followingCount, followersCount}) => ({ username, name, birthdate,followingCount, followersCount}))(notMe);
    }
    else {
        returnedUser = notMe;
    }
    return returnedUser;
};

const getMe = async username => {
    const me = await getProfile(req.user.id);
    res.status(200).json(me);
};

exports.getProfile = catchAsync(async (req, res, next) => {
    const sentUser = req.params.username;
    const me = req.user.username;
    let currentUser;
    if(me === sentUser) {
        currentUser = await getMe(me);
    }
    else {
        currentUser = await getUser(sentUser);
    }
    res.status(200).json(currentUser);
});

const getEditProfile = async (userId) => {
    const userProfile = await user.findById(userId).select('image headerImage name bio country city website birthdate');
    return userProfile;
};

exports.getEditProfile = catchAsync(async (req, res, next) => {
    const userProfile = await getEditProfile(req.user.id);
    res.status(200).json(userProfile);
});
  
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



  