const {MongooseQueryParser} = require('mongoose-query-parser');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const ApiFeatures = require('./../utils/apiFeatures');
        
const user = require('../models/user');
const tweet = require('../models/tweet');

// find users by username, name
/**
 * 
 * @param {Object} regex - The object that contains the user info in regex form
 * @param {Object} queryParams - The query parameters sent in the search
 * @returns {object} - The users searched for
 */
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
/**
 * 
 * @param {Object} regex - The object that contains the tweet info in regex form
 * @param {Object} queryParams - The query parameters sent in the search
 * @returns {object} - The tweet searched for
 */
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

/**
 * 
 * @param {Object} regex - The object that contains the media of the tweet info in regex form
 * @param {Object} queryParams - The query parameters sent in the search
 * @returns {object} - The media of the tweets searched for
 */
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

/**
 * 
 * @param {Object} regex - The object that contains the latest tweets info in regex form
 * @param {Object} queryParams - The query parameters sent in the search
 * @returns {object} - The latest tweets searched for
 */
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
    const meId = req.user.id;

    const myProfile = await user.findById(meId);
    const myRetweets = myProfile.retweetedTweets;
    const myLikes = myProfile.likedTweets;
    const myBookmarks = myProfile.bookMarkedTweets;
    const myFollowing = myProfile.following;

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
    if(response.tweets) {
      let tempTweets = [];
      for (const element of response.tweets) {
        let tweep = await user.findById(element.user);
        toReturn = {...element};
        didIRetweet = myRetweets.filter(x => x._id.toString() === element._id.toString());
        didIRetweet = didIRetweet.length? true:false;
        didILike = myLikes.filter(x => x._id.toString() === element._id.toString());
        didILike = didILike.length? true:false;
        didIBookmark = myBookmarks.filter(x => x._id.toString() === element._id.toString());
        didIBookmark = didIBookmark.length? true:false;
        isFollow = myFollowing.filter(x => x._id.toString() === element.user.toString());
        isFollow = isFollow.length? true:false;

        tempObj = { username:tweep.username, name:tweep.name, image:tweep.image, 
                   isLikedByMe: didILike, isRetweetedByMe: didIRetweet, isBookmarkedByMe: didIBookmark,
                   followHim: isFollow,
                   ...toReturn._doc};

        delete tempObj.user; 
        tempTweets.push(tempObj);
      }
      response.tweets = tempTweets;
    }
      if(response.users) {
        let tempUsers = [];
        for (const element of response.users) {
          isFollow = myFollowing.filter(x => x._id.toString() === element._id.toString());
          isFollow = isFollow.length? true:false;
          toReturn = {...element};
  
          tempObj = { ...toReturn._doc, followHim: isFollow};
  
          delete tempObj.user; 
          tempUsers.push(tempObj);
        }
    response.users = tempUsers;
    }
  
    res.status(200).json(response);
});