const {MongooseQueryParser} = require('mongoose-query-parser');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');
        
const user = require('../models/user');
const tweet = require('../models/tweet');

// find users by username, name

const getUsers = async (regex, queryParams) => {
    const features = new ApiFeatures(
        user.find({
        $or:[
        {name: {
          $regex: regex
        }},
        {username: {
          $regex: regex
        }}
        ]
      }),
      queryParams
    );
  
    return await features.query;
  
  };
  
// find by body

const getTweets = async (regex, queryParams) => {
    const features = new ApiFeatures(
      tweet.find({
        body: {
          $regex: regex
        },
      }),
      queryParams
    );
  
    return await features.query;
};

const getTweetsMedia = async (regex, queryParams) => {
    const features = new ApiFeatures(
      tweet.find({
        body: {
          $regex: regex
        },
        media: { $ne: [] },
      }),
      queryParams
    );
  
    return await features.query;
};

const getTweetsLatest = async (regex, queryParams) => {
    const features = new ApiFeatures(
      tweet.find({
        body: {
          $regex: regex
        }
      }),
      queryParams
    ).sort();
  
    return await features.query;
};

//req: query: q-> "text to search for", f-> user or tweet

exports.search = catchAsync(async (req, res, next) => {
    const queryString = req.query.q;
    const types = req.query.f ? req.query.f.split(',') : ['user'];
    let regex;

    const filteredWords = queryString.split(' ').map(word => word.trim());
    let regexExpression = '';
    filteredWords.forEach(word => {regexExpression += `(?=.*${word})`;});
    regex = new RegExp(regexExpression, 'i');
  
    const response = {};
    if (types.includes('top')) {
        response.users = await getUsers(regex, req.query);
        response.tweets = await getTweets(regex, req.query);
    }
    //if (types.includes('tweet')) response.tweets = await getTweets(regex, req.query);
    if (types.includes('user')) response.users = await getUsers(regex, req.query);
    if (types.includes('media')) response.tweets = await getTweetsMedia(regex, req.query);
    if (types.includes('latest')) response.tweets = await getTweetsLatest(regex, req.query);
  
    res.status(200).json(response);
});