const mongoose = require('mongoose');
const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const tweet = require('../models/tweet');
const report = require('../models/report');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { _infoTransformers } = require('passport/lib');
const authentication = require('./authentication')


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

exports.dashboardStatistics = catchAsync(async (req, res, next) => {

    const topReports = await topFiveReported ();
    const topLiked = await topFiveLiked ();
    const topFollowed = await topFiveFollowed();

    res.status(200).json({
        success: 'true',
        TopReported: topReports,
        TopFollowers: topFollowed,
        TopLikes: topLiked
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
    if(!sentUserId) throw new AppError('This username does not exists.',401);
    currUserReports = await report.find({_id: {$in: currUserReports.reports}}).sort({"type": 1});

    res.status(200).json({
        success: 'true',
        reports: currUserReports
    });
});

exports.getUsers = catchAsync(async (req, res, next) => {
    //getting user in route params
    const users = await user.find().select('username name bio');

    res.status(200).json({
        success: 'true',
        user: users
    });
});