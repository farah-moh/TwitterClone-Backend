const mongoose=require ('mongoose');
const { ObjectId } = require('mongoose').Types;
const _ = require("lodash");
const user = require('../models/user');
const tweet = require('../models/tweet');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const getTrending= async() => {
    const arr= ["Sports","News","Entertainment"];
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
    const tweetsCount=[];
    for (let i=0;i<hashtags.length;i++)
    {
        const tweets= await getAllTweets(hashtags[i]);
        tweetsCount.push(tweets.length);
    }
    const data = await hashtags.map(function(bdy,i)
    {
        return {
            rank: i+1,
            body: bdy,
            tweetsCount: tweetsCount[i],
            type: arr[Math.floor(Math.random() * arr.length)],
            id: Math.random().toString(36).slice(2,11)
        };
    })
    return data;
    }
    
    const tweetsCount=[];
    for (let i=0;i<result2.length;i++)
    {
        const tweets= await getAllTweets(result2[i],0);
        tweetsCount.push(tweets.length);
    }
    const data = await result2.map(function(bdy,i)
    {
        return {
            rank: i+1,
            body: bdy,
            tweetsCount: tweetsCount[i],
            type: arr[Math.floor(Math.random() * arr.length)],
            id: Math.random().toString(36).slice(2,11)
        };
    })
    return data;
}
exports.getTrending = getTrending;

const getAllTweets= async(sentHashtag,mode) => {
    const tweets = await tweet.find({hashtags: sentHashtag});
    if(mode===0)
    {
        return tweets;
    }
    const tweets1 = await _.sortBy(tweets,[function(o) {
        return o.retweeters.length;
    }]);
    const tweets2 = await tweets1.reverse();
    const data=[];
    for (let i=0;i<tweets2.length;i++)
    {
        const User = await user.findById(ObjectId(tweets2[i].user));
        let isLikedNew = false;
                    if(User.likedTweets){
                        for(let likedTweet of User.likedTweets){
                            if((likedTweet).toString() === (tweets2[i]._id).toString())
                                isLikedNew = true
                        }
                    }
                    let isLiked = (isLikedNew)? "true" : "false";
                    //Check if its retweeted by the main user
             
                    let isRetweetedNew = false;
                    if(User.retweetedTweets){
                        for(let retweetedTweet of User.retweetedTweets){
                            if((retweetedTweet).toString() === (tweets2[i]._id).toString())
                                isRetweetedNew = true
                        }
                    }
                
                    let isRetweeted = (!isRetweetedNew)? "false" : "true";
                    //Check if it's bookmarked by the mainUser
                    let isBookmarked = false;
                    
                    if(User.bookMarkedTweets){
                        for(let tweetBookmarked of User.bookMarkedTweets){
                            if((tweetBookmarked).toString() === (tweets2[i]._id).toString())
                                isBookmarked = true
                        }
                    }
                    

                    //Checking if there is a pooll
                    let poll = (tweets2[i].poll)? "true" : "false";
                    let firstChoice = "";
                    let firstChoiceStats = 0;
                    let secondChoice = "";
                    let secondChoiceStats = 0;
                    let thirdChoice = "";
                    let thirdChoiceStats = 0;
                    let fourthChoice = "";
                    let fourthChoiceStats = 0;
                    //Calculating the stats
                    if(tweets2[i].poll){
                        let sum = 0;
                        let newPoll = await polls.findById(tweets2[i].poll)
                        if(newPoll.choice1){
                            sum += newPoll.choice1Statistics.length;
                            firstChoice = newPoll.choice1;
                        }
                        if(newPoll.choice2){
                            sum += newPoll.choice2Statistics.length;
                            secondChoice =newPoll.choice2;
                        }
                        if(newPoll.choice3){
                            sum += newPoll.choice3Statistics.length;
                            thirdChoice = newPoll.choice3;
                        }
                        if(newPoll.choice4){
                            sum +=newPoll.choice4Statistics.length;
                            fourthChoice = newPoll.choice4;
                        }
                        if(newPoll.choice1 && sum!=0)
                            firstChoiceStats = (newPoll.choice1Statistics.length)/sum
                        if(newPoll.choice2 && sum!=0)
                            secondChoiceStats = (newPoll.choice2Statistics.length)/sum
                        if(newPoll.choice3 && sum!=0)
                            thirdChoiceStats = (newPoll.choice3Statistics.length)/sum
                        if(newPoll.choice4 && sum!=0)
                            fourthChoiceStats = (newPoll.choice4Statistics.length)/sum

                    }
                    // writing the json file hat will be sent
                    let usernamesTagged = []
                    if(tweets2[i].taggedUsers.length){
                        for(let index of tweets2[i].taggedUsers){
                            let userTagged = await user.findById(index)
                            if(userTagged){
                                usernamesTagged.push(userTagged.username);
                            }
                        }
                    } 
        const info = {
                        key:tweets2[i]._id,
                        username: User.username,
                        name: User.name,
                        email: User.email,
                        userImage: User.image,
                        tweetBody: tweets2[i].body,
                        tweetMedia: tweets2[i].media,
                        repliesCount: (tweets2[i].replies)? (tweets2[i].replies).length: 0, 
                        retweetersCount: (tweets2[i].retweeters)?(tweets2[i].retweeters).length : 0,
                        favoritersCount: (tweets2[i].favoriters)? (tweets2[i].favoriters).length : 0,
                        createdAt: tweets2[i].createdAt,
                        taggedUsers: usernamesTagged,
                        isLikedByUser: isLiked,
                        isRetweetedByUser: isRetweeted,
                        isBookmarkedByUser: isBookmarked,
                        isAdmin: User.isAdmin,
                        poll: poll,
                        firstChoice: firstChoice,
                        firstChoiceStats: firstChoiceStats*100,
                        secondChoice: secondChoice,
                        secondChoiceStats: secondChoiceStats*100,
                        thirdChoice: thirdChoice,
                        thirdChoiceStats: thirdChoiceStats*100,
                        fourthChoice: fourthChoice,
                        fourthChoiceStats: fourthChoiceStats*100,
                        hashtags: tweets2[i].hashtags
        }
        data.push(info);
    }
    return data;
}
exports.getAllTweets = getAllTweets;

exports.getHashtags = catchAsync(async (req, res, next) => {
    try {
        const hashtags= await getTrending(); 

        if(hashtags.length==0)
        {
            throw new AppError(
                `Hashtags are no longer exists`,
                404
              );
        }
        
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

        if(tweets.length==0)
        {
            throw new AppError(
                `Tweets are no longer exists`,
                404
              );
        }
        
        return res.status(200).json({status: 'Success', success: true, tweets});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }
})