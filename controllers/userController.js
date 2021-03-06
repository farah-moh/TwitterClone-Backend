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
const {  _infoTransformers } = require('passport/lib');
const authentication = require('./authentication');
const notifications = require('../models/notifications');
const activity = require('../models/activity');
const uploadAWSImage = require('../utils/uploadIMG');
const uploadIMG = require('../utils/uploadIMG');
require('./../utils/awsS3');

/**
 * @description - Takes user ID and and returns its info
 * @param {object} userId - The user's ID
 * @param {string} type - The type of the page
 * @returns {Object} User object
 */
const getProfile = async (userId, meId, type) => {
    const sortByDate = arr => {
        const sorter = (a, b) => {
           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        arr.sort(sorter);
    };
    const userProfile = await user.findById(userId);
    const myProfile = await user.findById(meId);
    const followingCount = userProfile.following.length;
    const followersCount = userProfile.followers.length;
    const likes = userProfile.likedTweets;
    const allTweets = userProfile.tweets;
    const allRetweets = userProfile.retweetedTweets;
    const myRetweets = myProfile.retweetedTweets;
    const myLikes = myProfile.likedTweets;
    const myBookmarks = myProfile.bookMarkedTweets;

    const returnedUser = (({ username, name, followingCount,followersCount, birthdate, tweets, protectedTweets,country,city,bio,website,image,headerImage,createdAt}) => ({ username, name, followingCount,followersCount, birthdate, tweets, protectedTweets,country,city,bio,website,image,headerImage,createdAt}))(userProfile);
    
    let retweets = await tweet.find({_id: {$in: allRetweets}});
    let userTweets = await tweet.find({_id: {$in: allTweets}});
    let likedTweets = await tweet.find({_id: {$in: likes}});
    let mediaTweets = userTweets.filter(x => x.media.length > 0);

    tempTweets = [];
    userTweets.forEach(function (element) {
        toReturn = {...element};
        didIRetweet = myRetweets.filter(x => x._id.toString() === element._id.toString());
        didIRetweet = didIRetweet.length? true:false;
        didILike = myLikes.filter(x => x._id.toString() === element._id.toString());
        didILike = didILike.length? true:false;
        didIBookmark = myBookmarks.filter(x => x._id.toString() === element._id.toString());
        didIBookmark = didIBookmark.length? true:false;
        tempObj = { username:userProfile.username, name:userProfile.name, image:userProfile.image, ...toReturn._doc, isLikedByMe: didILike, isRetweetedByMe: didIRetweet, isBookmarkedByMe: didIBookmark};
        delete tempObj.user; 
        tempTweets.push(tempObj);
    });
    returnedUser["tweets"] = tempTweets;

    for (const element of retweets) {
        let tweep =  await user.findById(element.user).select('username name image');
        toReturn = {...element};
        didIRetweet = myRetweets.filter(x => x._id.toString() === element._id.toString());
        didIRetweet = didIRetweet.length? true:false;
        didILike = myLikes.filter(x => x._id.toString() === element._id.toString());
        didILike = didILike.length? true:false;
        didIBookmark = myBookmarks.filter(x => x._id.toString() === element._id.toString());
        didIBookmark = didIBookmark.length? true:false;
        tempObj = { username:tweep.username, name:tweep.name, image:tweep.image, ...toReturn._doc, isLikedByMe: didILike, isRetweetedByMe: didIRetweet, isBookmarkedByMe: didIBookmark};
        delete tempObj.user; 
        returnedUser["tweets"].push(tempObj);
    }
    sortByDate(returnedUser["tweets"]);
    
    if(type==='profile') {
        noReplies = returnedUser["tweets"].filter(x => x.isReply===false || x.username!==userProfile.username);
        sortByDate(noReplies);
        returnedUser["tweets"] = noReplies;
    }
    //needs testing
    else if(type==='media') {
        tempMedia = [];
        mediaTweets.forEach(function (element) {
            toReturn = {...element};
            didIRetweet = myRetweets.filter(x => x._id.toString() === element._id.toString());
            didIRetweet = didIRetweet.length? true:false;
            didILike = myLikes.filter(x => x._id.toString() === element._id.toString());
            didILike = didILike.length? true:false;
            didIBookmark = myBookmarks.filter(x => x._id.toString() === element._id.toString());
            didIBookmark = didIBookmark.length? true:false;
            tempObj = { username:userProfile.username, name:userProfile.name, image:userProfile.image, ...toReturn._doc, isLikedByMe: didILike, isRetweetedByMe: didIRetweet, isBookmarkedByMe: didIBookmark};
            delete tempObj.user; 
            tempMedia.push(tempObj);
        });     
        sortByDate(tempMedia);  
        returnedUser["tweets"] = tempMedia;
    }
    else if(type==='likes') {
        tempLikes = [];
        for (const element of likedTweets) {
            let tweep =  await user.findById(element.user).select('username name image');
            console.log(tweep);
            toReturn = {...element};
            didIRetweet = myRetweets.filter(x => x._id.toString() === element._id.toString());
            didIRetweet = didIRetweet.length? true:false;
            didILike = myLikes.filter(x => x._id.toString() === element._id.toString());
            didILike = didILike.length? true:false;
            didIBookmark = myBookmarks.filter(x => x._id.toString() === element._id.toString());
            didIBookmark = didIBookmark.length? true:false;
            tempObj = { username:tweep.username, name:tweep.name, image:tweep.image, ...toReturn._doc, isLikedByMe: didILike, isRetweetedByMe: didIRetweet, isBookmarkedByMe: didIBookmark};
            delete tempObj.user; 
            tempLikes.push(tempObj);
          }
        sortByDate(tempLikes);
        returnedUser["likes"] = tempLikes;
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
    let notMe = await getProfile(notMeId,meId,type);

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
    
    let requests = await user.findById(notMeId).select('followRequests');
    requests = requests.followRequests;
    requests = requests.filter(x => x.toString() === meId);

    let followsMe = followsMeProp.length? true:false;
    let followHim = mutuals.length? true:false;
    let followRequest = requests.length? true:false;
    notMe["followsMe"] = followsMe;
    notMe["followHim"] = followHim;
    notMe["pending"] = followRequest;
    
    //if private user & I don't follow him, don't send tweets
    if(isProtected && !mutuals.length && !iAmAdmin) {
        //removing tweets from returnedUser
        returnedUser = 
        (({ username, name, birthdate, followingCount, followersCount, followsMe, followHim, pending, protectedTweets,country,city,bio,website,image,headerImage,createdAt}) => 
        ({ username, name, birthdate,followingCount, followersCount, followsMe, followHim, pending, protectedTweets,country,city,bio,website,image,headerImage,createdAt}))(notMe);
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
const getMe = async (sentUserId,meId,type) => {
    const me = await getProfile(sentUserId,meId,type);
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
        currentUser = await getMe(sentUserId,meId,type);
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
const editProfileFunc = async (userId, newInfo,imgData) => {
    let editedUser = await user.findById(userId);
    if(imgData){
        const imgObjects = await uploadIMG(
            imgData,
            'user',
            userId
        );
        editedUser.image = imgObjects;
        await editedUser.save();
    }
    editedUser = await user.findByIdAndUpdate(userId, newInfo, {
            new: true
    });
    if (!editedUser) throw new AppError('No user with this id', 404);
    return editedUser;
};
exports.editProfileFunc = editProfileFunc;


exports.editProfile = catchAsync(async (req, res, next) => {
    let  editedUser;
    if(req.files) editedUser = await editProfileFunc(req.user._id, req.body, req.files.image.data);
    else editedUser = await editProfileFunc(req.user._id, req.body, null);
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
        return res.status(200).json({
            status: 'already follows',
          });
    }
    const notMe = await user.findById(notMeId);
    const me = await user.findById(meId);
    let isProtected= notMe.protectedTweets;

    let activityUser = new activity({
        sender: me,
        receiver: notMe,
        activityType: "follow"
    })
    await activityUser.save()
    //creating the notification using the activity created above
    let notification = new notifications({
        activity: activityUser,
        notificationStream: isProtected?`${me.username} has requested to follow you`: `${me.username} is now following you`
    })
   //  //updating the date

    await notification.save();

    //pushing the notification to the array of the tagged user
    notMe.notificationsArray.push(notification._id)
    notMe.notificationFlag = true;


    if(notMe.protectedTweets) {
        if(notMe.followRequests.indexOf(meId)!==-1)
        {
            return res.status(200).json({
                status: 'Follow request already sent',
              });
        }
        notMe.followRequests.push(me);
        await notMe.save();
        return res.status(200).json({
            status: 'Follow request sent',
          });
    }
    await follow.create({follower:meId, following: notMeId});
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

exports.getFollowers = catchAsync(async (req, res, next) => {
    let meId = req.user.id;
    let who = req.params.username;
    meId = new ObjectId(meId);
    who = await user.findOne({username: who});
    let me = await user.findById(meId);
    let whoID = who._id;

    let followers = who.followers;
    followers = await user.find({_id: {$in: followers}}).select('username name bio protectedTweets image');
    let myFollowers = me.followers;
    let myFollowing = me.following;
    let requests = who.followRequests;

    followers = followers.map(obj => ({ ...obj._doc, 
        followsMe: (myFollowers.includes(obj._id))? true:false,
        followsHim: (myFollowing.includes(obj._id))? true:false,
        pending: (requests.includes(meId))? true:false,
        isMe: (meId.toString() === obj._id.toString())? true:false,
     }));

    res.status(200).json({
        status: 'success',
        followers: followers
    });
});

exports.getFollowing = catchAsync(async (req, res, next) => {
    let meId = req.user.id;
    let who = req.params.username;
    meId = new ObjectId(meId);
    who = await user.findOne({username: who});
    let me = await user.findById(meId);
    let whoID = who._id;
    let requests = who.followRequests;

    let following = who.following;
    following = await user.find({_id: {$in: following}}).select('_id username name bio protectedTweets image');
    let myFollowers = me.followers;
    let myFollowing = me.following;

    for (const element of following) {
        let requests =  await user.findById(element._id).select('followRequests');
        requests = requests.followRequests;
        console.log(requests);
        let pending = (requests.includes(meId))? true:false;
        element["pending"] = pending;
        console.log(element);
    }
    following = following.map(obj => ({ ...obj._doc, 
        followsMe: (myFollowers.includes(obj._id))? true:false,
        followsHim: (myFollowing.includes(obj._id))? true:false,
        pending: (requests.includes(meId.toString()))? true:false,
        isMe: (meId.toString() === obj._id.toString())? true:false,
        pending: obj.pending
     }))
     

    res.status(200).json({
        status: 'success',
        following: following
    });
});

exports.getFollowRequests = catchAsync(async (req, res, next) => {
    const User = await user.findOne({_id: req.user.id});
    const requests = User.followRequests;
    const usersArr = [];
    for (let i=0;i<requests.length;i++)
    {
        const requested = await user.findOne({_id: requests[i]}).select('name username image');
        usersArr.push(requested);
    }
    res.status(200).json({
        status: 'success ',
        usersArr
    }); 
});

exports.acceptFollowRequests = catchAsync(async (req, res, next) => {
    let meId = req.user.id;
    const toFollowMe = req.body.username;
    meId = new ObjectId(meId);

    let notMeId = await user.findOne({username: toFollowMe}).select('_id');
    notMeId = notMeId._id;
    let alreadyFollows = await follow.find({follower: notMeId, following: meId});
    if(alreadyFollows.length) {
        return res.status(200).json({
            status: 'already following',
          });
    }

    await follow.create({follower:notMeId, following: meId});
    const me = await user.findById(meId);
    const notMe = await user.findById(notMeId);
    me.followers.push(notMeId.toString());
    notMe.following.push(meId.toString());
    
    await me.save();
    await notMe.save();
    
    await user.updateOne({_id: meId}, {$pull: {followRequests: notMeId}});

    res.status(200).json({
        status: 'success',
    });
});

exports.rejectFollowRequests = catchAsync(async (req, res, next) => {
    await user.updateOne({_id: req.user.id}, {$pull: {followRequests: req.body.id}});
    res.status(200).json({
        status: 'success',
    });
});