const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');
const { _infoTransformers } = require('passport/lib');
const authentication = require('./authentication')


const getProfile = async (userId,type) => {
    const userProfile = await user.findById(userId);
    const followingCount = userProfile.following.length;
    const followersCount = userProfile.followers.length;
    const likes = userProfile.likedTweets;
    const returnedUser = (({ username, name, birthdate, tweets, protectedTweets,country,city,bio,website,createdAt }) => ({ username, name, birthdate, tweets, protectedTweets,country,city,bio,website,createdAt }))(userProfile);

    if(type==='profile') {
        let no_replies = returnedUser.tweets;
        no_replies = no_replies.filter(x => x.isReply===false);
        returnedUser["tweets"] = no_replies;
    }
    //needs testing
    else if(type==='media') {
        let imageTweet = returnedUser.tweets.find(x=> x.media.length > 0);
        let images = [];
        for(let tweet in imageTweet) {
            for(let image of tweet.media) {
                images.push(image);
            }
        }
        returnedUser["media"] = images;
        delete returnedUser.tweets;
    }
    else if(type==='likes') {
        returnedUser["likes"] = likes;
        delete returnedUser.tweets;
    }
    returnedUser["followingCount"] = followingCount;
    returnedUser["followersCount"] = followersCount;
    return returnedUser;
};

/*
1- get my id
2- check follows me
3- check protected
*/

const getUser = async (notMeId,meId,type)  => {

    //getting profile
    let notMe = await getProfile(notMeId,type);

    //checking if I am following user
    let mutuals = await user.findById(meId).select('following');
    mutuals = mutuals.following.find(x => x._id === notMeId);

    //checking if user follows me
    let followsMeProp = await user.findById(meId).select('followers');
    followsMeProp = followsMeProp.followers.find(x => x._id === notMeId);

    //checking if their profile is protected
    let isProtected = notMe.protectedTweets;
    
    let followsMe = followsMeProp? true:false;
    notMe["followsMe"] = followsMe;
    let returnedUser;
    
    //if private user & I don't follow him, don't send tweets
    if(isProtected && !mutuals) {
        //removing tweets from returnedUser
        returnedUser = 
        (({ username, name, birthdate, followingCount, followersCount, followsMe, protectedTweets,country,city,bio,website,createdAt}) => 
        ({ username, name, birthdate,followingCount, followersCount, followsMe, protectedTweets,country,city,bio,website,createdAt}))(notMe);
        //returnedUser = await notMe.select('-tweets');
    }
    else {
        returnedUser = notMe;
    }
    returnedUser["isMe"] = false;
    return returnedUser;
};

const getMe = async (meId,type) => {
    const me = await getProfile(meId,type);
    me["isMe"] = true;
    return me;
};

const preGetProfile = async (sentUsername,meId, type, next) => {
    //getting user in route params
    // console.log(type);
    let sentUserId = await user.findOne({'username': sentUsername}).select('_id');
    if(!sentUserId) throw new AppError('This username does not exists.',401);
    sentUserId = sentUserId._id.toString();

    //getting my id from req user (protect)
    let me = await user.findById(meId).select('username');
    me = me.username;

    let currentUser;
    //checking if I am visiting my profile, or another user's profile
    if(me === sentUsername) {
        currentUser = await getMe(meId,type);
    }
    else {
        currentUser = await getUser(sentUserId,meId,type);
    }
    return currentUser;
};

exports.getProfileMedia = catchAsync(async (req, res, next) => {
    //getting user in route params
    const sentUser = req.params.username;
    const meId = req.user.id;

    const currentUser = await preGetProfile(sentUser,meId,'media');

    res.status(200).json(currentUser);
});

exports.getProfileLikes = catchAsync(async (req, res, next) => {
    //getting user in route params
    const sentUser = req.params.username;
    const meId = req.user.id;

    const currentUser = await preGetProfile(sentUser,meId,'likes');

    res.status(200).json(currentUser);
});

exports.getProfileWithReplies = catchAsync(async (req, res, next) => {
    //getting user in route params
    const sentUser = req.params.username;
    const meId = req.user.id;

    const currentUser = await preGetProfile(sentUser,meId,'replies');

    res.status(200).json(currentUser);
});

exports.getProfile = catchAsync(async (req, res, next) => {
    //getting user in route params
    const sentUser = req.params.username;
    const meId = req.user.id;

    const currentUser = await preGetProfile(sentUser,meId,'profile');

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



  