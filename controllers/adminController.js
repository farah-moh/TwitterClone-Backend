const mongoose = require('mongoose');
const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const tweet = require('../models/tweet');
const follow = require('../models/follow');
const report = require('../models/report');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { _infoTransformers } = require('passport/lib');
const authentication = require('./authentication');
const { findById } = require('../models/user');


const topFiveReported = async () => {
    //getting user in route params
    let users = await user.find().select('username reports');

    let mapped = await Promise.all(users.map(async (element) => {
        let name = element.username;
        let reports = element.reports.length;
        return {name: name, Reports: reports};
    }));

    mapped = mapped.sort((a, b) => (a.Reports > b.Reports ? 1 : -1)).reverse().slice(0,5);

    return mapped;
};


const topFiveLiked = async () => {
    //getting user in route params
    let tweets = await tweet.find().select('user favoriters');

    let mapped = await Promise.all(tweets.map(async (element) => {
        let name = await user.findById(element.user).select('username');
        name = name.username;
        let likes = element.favoriters.length;
        return {name: name, Likes: likes};
    }));

    mapped = mapped.sort((a, b) => (a.Likes > b.Likes ? 1 : -1)).reverse().slice(0,5);
    
    return mapped;
};

const topFiveFollowed = async () => {
    //getting user in route params
    let users = await user.find().select('username followers');

    const mapped = users.map((element) => ({
        name: element.username,
        Followers: element.followers.length
      })).sort((a, b) => (a.Followers > b.Followers ? 1 : -1)).reverse().slice(0,5);

    return mapped;
};

const topTweetsTrend = async () => {
    let tweets = await tweet.find().select('-_id hashtags');
    let stats = [];
    for (const element of tweets) {
        let hashtags = element.hashtags;
        for(const element2 of hashtags) {
            doneBefore = stats.findIndex(x => x.hashtag === element2);
            if(doneBefore!=-1) {
                stats[doneBefore].count = stats[doneBefore].count+1;
            }
            else stats.push({hashtag: element2, count: 1})
        }
    }
    stats.sort((a, b) => (a.count > b.count ? 1 : -1)).reverse().slice(0,5);
    console.log(stats);
    return stats;
}

const userStatsInfo = async (username) => {

    const yesterdayNo = 86400000;
    let percentageTweets, percentageFollowers;

    let users = await user.findOne({username: username}).select('tweets');
    let userId = await user.findOne({username: username}).select('_id');
    userId = userId._id;

    tweets = await tweet.find({_id: {$in: users.tweets}});
    follows = await follow.find({following: userId});

    let tweetsCount1 = tweets.filter(x => (x.createdAt >= new Date(Date.now() - yesterdayNo*7) && x.createdAt <= new Date(Date.now())));
    let tweetsCount2 = tweets.filter(x => (x.createdAt >= new Date(Date.now() - yesterdayNo*14) && x.createdAt <= new Date(Date.now()-yesterdayNo*7)));

    let followersCount1 = follows.filter(x => (x.createdAt >= new Date(Date.now() - yesterdayNo*7) && x.createdAt <= new Date(Date.now())));
    let followersCount2 = follows.filter(x => (x.createdAt >= new Date(Date.now() - yesterdayNo*14) && x.createdAt <= new Date(Date.now()-yesterdayNo*7)));

    tweetsCount1 = tweetsCount1.length;
    tweetsCount2 = tweetsCount2.length;
    followersCount1 = followersCount1.length;
    followersCount2 = followersCount2.length;

    if(!tweetsCount2) percentageTweets = 100;
    else percentageTweets = (100*(tweetsCount1 - tweetsCount2)/tweetsCount2);
    if(!followersCount2) percentageFollowers = 100;
    else percentageFollowers = (100*(tweetsCount1 - tweetsCount2)/tweetsCount2);
    
    const AdminUserStatsInfo = [{id: 0, counter: tweetsCount1, percentage: percentageTweets}, {id:1, counter: followersCount1, percentage: percentageFollowers}];

    return AdminUserStatsInfo;
};

const topUsersPerWeekIncrease = async () => {

    const yesterdayNo = 86400000;
    let currentDay = new Date();

    const id = 0;
    let counter = 0;
    let percentage;

    let userCount1 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*7),$lt: new Date(Date.now())}})
    let userCount2 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*14),$lt: new Date(Date.now()-yesterdayNo*7)}})

    userCount1 = userCount1.length;
    userCount2 = userCount2.length;

    counter = userCount1;
    if(!userCount2) percentage = 100;
    else percentage = (100*(userCount1 - userCount2)/userCount2);

    const UserStats = {id: id, counter: counter, percentage: percentage};

    return UserStats;
};

const topUsersPerMonthIncrease = async () => {

    const yesterdayNo = 86400000;
    let currentDay = new Date();

    const id = 1;
    let counter = 0;
    let percentage;

    let userCount1 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*30),$lt: new Date(Date.now())}})
    let userCount2 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*60),$lt: new Date(Date.now()-yesterdayNo*30)}})

    userCount1 = userCount1.length;
    userCount2 = userCount2.length;

    counter = userCount1;
    if(!userCount2) percentage = 100;
    else percentage = (100*(userCount1 - userCount2)/userCount2);
    
    const UserStats = {id: id, counter: counter, percentage: percentage};

    return UserStats;
};

const topUsersPerWeek = async () => {

    var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday","Saturday"];
    const yesterdayNo = 86400000;
    let currentDay = new Date();

    let topUsersWeek=[]

    let userCount1 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo),$lt: new Date(Date.now())}})
    let userCount2 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*2),$lt: new Date(Date.now() - yesterdayNo)}})
    let userCount3 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*3),$lt: new Date(Date.now() - yesterdayNo*2)}})
    let userCount4 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*4),$lt: new Date(Date.now() - yesterdayNo*3)}})
    let userCount5 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*5),$lt: new Date(Date.now() - yesterdayNo*4)}})
    let userCount6 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*6),$lt: new Date(Date.now() - yesterdayNo*5)}})
    let userCount7 = await user.find({createdAt:{$gte: new Date(Date.now() - yesterdayNo*7),$lt: new Date(Date.now() - yesterdayNo*6)}})

    //console.log(currentDay.getDay());
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount1.length});
    currentDay.setDate(currentDay.getDate() - 1);
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount2.length});
    currentDay.setDate(currentDay.getDate() - 1);
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount3.length});
    currentDay.setDate(currentDay.getDate() - 1);
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount4.length});
    currentDay.setDate(currentDay.getDate() - 1);
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount5.length});
    currentDay.setDate(currentDay.getDate() - 1);
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount6.length});
    currentDay.setDate(currentDay.getDate() - 1);
    topUsersWeek.push({name: daysOfWeek[currentDay.getDay()] , users: userCount7.length});

    return topUsersWeek;
};

exports.dashboardStatistics = catchAsync(async (req, res, next) => {

    const topReports = await topFiveReported ();
    const topLiked = await topFiveLiked ();
    const topFollowed = await topFiveFollowed();
    const topUsersWeek = await topUsersPerWeek();
    const topUsersWeekIncrease = await topUsersPerWeekIncrease();
    const topUsersMonthIncrease = await topUsersPerMonthIncrease();
    const topTweetsPerTrend = await topTweetsTrend();
    let UserStats = [topUsersWeekIncrease, topUsersMonthIncrease];

    res.status(200).json({
        success: 'true',
        TopReported: topReports,
        TopFollowers: topFollowed,
        TopLikes: topLiked,
        topUsersPerWeek: topUsersWeek,
        topTweetsPerTrend: topTweetsPerTrend,
        UserStats: UserStats
    });
});

exports.getStatistics = catchAsync(async (req, res, next) => {
    //getting user in route params
    let currUser = req.params.username;
    currUser = await user.findOne({'username': currUser});
    if(!currUser) throw new AppError('This username does not exists.',401);

    let AdminUserStatsInfo = await userStatsInfo(req.params.username);

    res.status(200).json({
        AdminUserStatsInfo: AdminUserStatsInfo
    });
});

exports.banUser = catchAsync(async (req, res, next) => {
    //getting user in route params
    let currUser = req.params.username;
    currUser = await user.findOne({'username': currUser});
    if(!currUser) throw new AppError('This username does not exists.',401);

    await user.remove({'username':req.params.username});

    res.status(200).json({
        success: 'true'
    });
});

exports.getReports = catchAsync(async (req, res, next) => {
    //getting user in route params
    let currUser = req.params.username;
    let currUserReports = await user.findOne({'username': currUser});
    if(!currUserReports) throw new AppError('This username does not exists.',401);
    currUserReports = await report.find({_id: {$in: currUserReports.reports}}).sort({"type": 1});
    let users = currUserReports.map(x => x.whoReported);

    users = await user.find({_id: {$in: users}}).select('_id username name image');

    currUserReports = currUserReports.map((currElement, index) => {
        return {message: currElement.message, whoReported: users.filter(x => x._id.toString() == currElement.whoReported.toString())};
    });
    currUserReports = currUserReports.reduce((result, currentValue) => {
        (result[currentValue['message']] = result[currentValue['message']] || []).push(
          currentValue
        );
        return result;
      }, {});

    currUserReports['type1'] = currUserReports['I\'m not interested in this account.'];
    delete currUserReports['I\'m not interested in this account.'];
    currUserReports['type2'] = currUserReports['It\'s suspicious or spam.'];
    delete currUserReports['It\'s suspicious or spam.'];
    currUserReports['type3'] = currUserReports['It appears their account is hacked.'];
    delete currUserReports['It appears their account is hacked.'];
    currUserReports['type4'] = currUserReports['They are pretending to be me or someone else.'];
    delete currUserReports['They are pretending to be me or someone else.'];
    currUserReports['type5'] = currUserReports['Their tweets are abusive or hateful.'];
    delete currUserReports['Their tweets are abusive or hateful.'];
    currUserReports['type6'] = currUserReports['They are expressing intentions of self-harm or suicide'];
    delete currUserReports['They are expressing intentions of self-harm or suicide'];

    res.status(200).json({
        success: 'true',
        reports: currUserReports
    });
});

exports.getUsers = catchAsync(async (req, res, next) => {
    //getting user in route params
    const users = await user.find().select('username name bio image');

    res.status(200).json({
        success: 'true',
        user: users
    });
});