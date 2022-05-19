const mongoose = require('mongoose');
const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const tweet = require('../models/tweet');
const report = require('../models/report');
const follow = require('../models/follow');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');
const { _infoTransformers } = require('passport/lib');
const authentication = require('./authentication')

/**
 * @description - Takes user ID and and returns its info
 * @param {object} userId - The user's ID
 * @param {string} type - The type of the page
 * @returns {Object} User object
 */
const getProfile = async (userId,type) => {
    const userProfile = await user.findById(userId);
    const followingCount = userProfile.following.length;
    const followersCount = userProfile.followers.length;
    const likes = userProfile.likedTweets;

    const returnedUser = (({ username, name, followingCount,followersCount, birthdate, tweets, protectedTweets,country,city,bio,website,image,createdAt}) => ({ username, name, followingCount,followersCount, birthdate, tweets, protectedTweets,country,city,bio,website,image,createdAt}))(userProfile);

    if(type==='profile') {
        let no_replies = returnedUser.tweets;
        let userTweets = await tweet.find({_id: {$in: no_replies}});
        no_replies = userTweets.filter(x => x.isReply===false);
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

    let birthdate = returnedUser.birthdate;
    birthdate = `${birthdate.getFullYear()}-${birthdate.getMonth()+1}-${birthdate.getDate()}`;
    returnedUser["birthdate"] = birthdate;

    let createdAt = returnedUser.createdAt;
    createdAt = `${createdAt.getFullYear()}-${createdAt.getMonth()+1}-${createdAt.getDate()}`;
    returnedUser["createdAt"] = createdAt;

    return returnedUser;
};

/*
1- get my id
2- check follows me
3- check protected
*/
/**
 * @description - compares the ID of the sent user and the token id and return the correct data
 * @param {object} notMeId - The ID of the sent user
 * @param {object} meId - The ID of the token user
 * @param {string} type - The type of the page
 * @returns {object} - The user object
 */
const getUser = async (notMeId,meId,type)  => {

    //getting profile
    let notMe = await getProfile(notMeId,type);

    //checking if I am following user
    let mutuals = await user.findById(meId).select('following');
    mutuals = mutuals.following;
    mutuals = mutuals.filter(x => x.toString() === notMeId);

    //checking if user follows me
    let followsMeProp = await user.findById(meId).select('followers');
    followsMeProp = followsMeProp.followers;
    followsMeProp = followsMeProp.filter(x => x.toString() === notMeId);

    //checking if their profile is protected
    let isProtected = notMe.protectedTweets;
    
    let iAmAdmin = await user.findById(meId).select('isAdmin');
    iAmAdmin = iAmAdmin.isAdmin;
    
    
    let followsMe = followsMeProp.length? true:false;
    let followHim = mutuals.length? true:false;
    notMe["followsMe"] = followsMe;
    notMe["followHim"] = followHim;
    
    //if private user & I don't follow him, don't send tweets
    if(isProtected && !mutuals.length && !iAmAdmin) {
        //removing tweets from returnedUser
        returnedUser = 
        (({ username, name, birthdate, followingCount, followersCount, followsMe, followHim, protectedTweets,country,city,bio,website,image,createdAt}) => 
        ({ username, name, birthdate,followingCount, followersCount, followsMe, followHim, protectedTweets,country,city,bio,website,image,createdAt}))(notMe);
        //returnedUser = await notMe.select('-tweets');
    }
    else {
        returnedUser = notMe;
    }
    returnedUser["isMe"] = false;
    return returnedUser;
};
/**
 * @description - takes user id and type and returns attribute isMe
 * @param {object} meId - My ID
 * @param {object} type - The type of the page
 * @returns {object} - The user object
 */
const getMe = async (meId,type) => {
    const me = await getProfile(meId,type);
    me["isMe"] = true;
    return me;
};

/**
 * @description - Takes the requested username and the logged id and the type and returns the appropriate return tweets
 * @param {object} sentUsername - The sent username
 * @param {object} meId - My ID
 * @param {String} type - The type of the page
 * @param {middleware} next - next fucntion
 * @returns {Object} - The user object 
 */
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
exports.preGetProfile = preGetProfile;


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

/**
 * @description - Takes user ID and returns its info for editing
 * @param {string} userId - The user ID for editing
 * @returns {object} - The user info to edit
 */
const getEditProfileFunc = async (userId) => {
    const userProfile = await user.findById(userId).select('image headerImage name bio country city website birthdate');
    return userProfile;
};
exports.getEditProfileFunc = getEditProfileFunc;

exports.getEditProfile = catchAsync(async (req, res, next) => {
    const userProfile = await getEditProfileFunc(req.user.id);
    res.status(200).json(userProfile);
});

/**
 * @description - takes user id and info and update the setting
 * @param {string} userId - The user ID to be modified
 * @param {object} newInfo - The new info for modification
 * @returns {Object} - The user object to edit
 */
const editProfileFunc = async (userId, newInfo) => {

    const editedUser = await user.findByIdAndUpdate(userId, newInfo, {
        new: true
      });
    if (!editedUser) throw new AppError('No user with this id', 404);
    return editedUser;
};
exports.editProfileFunc = editProfileFunc;


exports.editProfile = catchAsync(async (req, res, next) => {
    const editedUser = await editProfileFunc(req.user._id, req.body);
    res.status(200).json(editedUser);
  });

const createReport = async body => {
    const newReport = await report.create({
        message: body.message,
        whoReported: body.reporter,
        reported: body.reported 
      });
      return newReport;
}

exports.reportProfile = catchAsync(async (req, res, next) => {
    const reportType = req.query.q;
    const reportedUser = req.params.username;
    let reportedUserId = await user.findOne({'username': reportedUser}).select('_id');
    reportedUserId = reportedUserId._id.toString();
    let meId = req.user.id;
    const meObj = mongoose.Types.ObjectId(meId);
    const reportedUserObj = mongoose.Types.ObjectId(reportedUserId);

    let message ='';
    if(reportType==='1') message = 'I\'m not interested in this account.';
    if(reportType==='2') message = 'It\'s suspicious or spam.';
    if(reportType==='3') message = 'It appears their account is hacked.';
    if(reportType==='4') message = 'They are pretending to be me or someone else.';
    if(reportType==='5') message = 'Their tweets are abusive or hateful.';
    if(reportType==='6') message = 'They are expressing intentions of self-harm or suicide';


    const reportObj = {
        message: message,
        reporter: meObj,
        reported: reportedUserObj,
        type: parseInt(reportType) 
    }
    const reportReturn = await createReport(reportObj);
    await reportReturn.save();

    let allReports = await user.findById(reportedUserObj);
    allReports = allReports.reports;
    allReports.push(new ObjectId(reportReturn._id));

    let User = await user.findById(reportedUserObj);
    User["reports"] = allReports;
    await User.save();

    //console.log(reports);

    res.status(200).json({
        status: 'success',
        message: 'Reported successfuly.',
        report: reportObj,
      });
  });


  exports.follow = catchAsync(async (req, res, next) => {
    let meId = req.user.id;
    const toFollow = req.params.username;
    meId = new ObjectId(meId);

    let notMeId = await user.findOne({username: toFollow}).select('_id');
    notMeId = notMeId._id;

    let alreadyFollows = await follow.find({follower: meId, following: notMeId});
    console.log(alreadyFollows);
    if(alreadyFollows.length) {
        res.status(200).json({
            status: 'already follows',
          });
    }
    await follow.create({follower:meId, following: notMeId});

    const me = await user.findById(meId);
    const notMe = await user.findById(notMeId);
    me.following.push(notMeId.toString());
    notMe.followers.push(meId.toString());

    await me.save();
    await notMe.save();

    res.status(200).json({
        status: 'success',
    });
  });

  exports.unfollow = catchAsync(async (req, res, next) => {
    let meId = req.user.id;
    const toFollow = req.params.username;
    meId = new ObjectId(meId);

    let notMeId = await user.findOne({username: toFollow}).select('_id');
    notMeId = notMeId._id;

    let alreadyDoesntFollow = await follow.find({follower: meId, following: notMeId});
    if(!alreadyDoesntFollow.length) {
        res.status(200).json({
            status: 'Already doesn\'t follow',
          });
    }
    await follow.deleteOne({follower:meId, following: notMeId});

    const me = await user.findById(meId);
    const notMe = await user.findById(notMeId);
    console.log(me.following);
    me.following = me.following.filter(x => x.toString() != notMeId);
    notMe.followers= me.followers.filter(x => x.toString() != meId);
    
    await me.save();
    await notMe.save();

    res.status(200).json({
        status: 'success',
    });
  });
  