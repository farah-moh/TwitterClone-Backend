const mongoose=require ('mongoose');
const { ObjectId } = require('mongoose').Types;
const _ = require("lodash");
const user = require('../models/user');
const tweet = require('../models/tweet');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getTrending= async() => {
    //Reurn hashtags only
    const trends= await tweet.find().select('hashtags');
    //Return array of arrays of hashtags
    const result = await trends.map(x => x.hashtags);
    //Return array of merged hashtags
    const result1 = await result.flat();
    //Sort hashtags by the most frequent
    const result2 = await _.chain(result1).countBy().toPairs().sortBy(1).reverse().map(0).value();
    //Reurn only 10 hashtags 
    if(result2.length > 10)
    {
    const hashtags = await result2.splice(10,result2.length-10);
    return hashtags;
    }
    return result2;
}
exports.getTrending = getTrending;

const getAllTweets= async(sentHashtag) => {
    const tweets = await tweet.find({hashtags: sentHashtag});
    const tweets1 = await _.sortBy(tweets,[function(o) {
        return o.retweeters.length;
    }]);
    const tweets2 = await tweets1.reverse();
    return tweets2;
}
exports.getAllTweets = getAllTweets;

exports.getHashtags = catchAsync(async (req, res, next) => {
    try {
        const hashtags= await getTrending(); 
        
        return res.status(200).json({status: 'Success', success: true, hashtags});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }

})

exports.getTrendingTweets = catchAsync(async (req, res, next) => {
    try {
        const tweets = await getAllTweets(req.params.hashtag); 
        
        return res.status(200).json({status: 'Success', success: true, tweets});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }
})