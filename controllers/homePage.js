const express = require('express'); 
const user = require('../models/user');
const tweet = require('../models/tweet');
const polls = require('../models/poll')
const notifications = require('../models/notifications');
const activity = require('../models/activity');
const { findById } = require('../models/user');
const poll = require('../models/poll');
const retweet = require('../models/retweet');
const uploadIMG = require('../utils/uploadIMG');

/**
 * @description This function is used to post a tweet and save it in the database
 * @param {*} req  
 * @param {*} res 
 * @returns {Object} This function returns the created tweet and the status of the post
 */

exports.postTweet = async(req, res)=>{
    //poll(true/false)
    const {body, media, taggedUsers, postedAt, hashtags, poll, firstChoice, secondChoice, thirdChoice, fourthChoice} = req.body;
    const userId =req.user.id;
    //const mediaUploaded = req.files.image.data;


    //Checking if there is something to post.
    if(!body && !media && !taggedUsers && !hashtags){
        return res.status(422).json({error: "Please enter data to post the tweet!"});
    }
    
    try{
        //Checking the count of media.
        if(media&&media.length>4)
            return res.status(500).json({error:"The media must be less than 5"});

        let createTweet = new tweet({
            user: userId  
        });
      
        //Checking the count of tagged users
        if(taggedUsers && taggedUsers.length>10)
            return res.status(422).json({error: "Can't tag more than 10 users!"});

        // Adding body/taggedUsers/media if exist
        if(body)
            createTweet.body = body;

        if(hashtags)
            createTweet.hashtags = hashtags; 
        
        // Adding tagged users by usernames
        let ids = [];
        if(taggedUsers){
            for(let users of taggedUsers){
                let mainUser = await user.findOne({username: users});
                if(mainUser)
                    ids.push(mainUser._id)
            }
            createTweet.taggedUsers = ids;
        } 
            
        
        //Adding media
        if (media)
            createTweet.media = media;

        //Schedule Tweet
        if(postedAt)
            createTweet.createdAt = new Date(postedAt)
        //If there is a poll
        if(poll == "true"){
            let newPoll = new polls({
                choice1: firstChoice
            })
            if(secondChoice)
                newPoll.choice2 = secondChoice
            if(thirdChoice)
                newPoll.choice3 = thirdChoice 
            if(fourthChoice)
                newPoll.choice4 = fourthChoice
        
            //Updating the date of createdAt
            if(postedAt)
                newPoll.createdAt = postedAt;
            await newPoll.save();
            createTweet.poll = newPoll;
        }
        //Saving tweet to database
        await createTweet.save();



        // if(mediaUploaded){
        //     const imgObjects = await uploadIMG(
        //         mediaUploaded,
        //         'tweet',
        //         createTweet._id
        //     );
        //     createTweet.media = imgObjects;
        //     await createTweet.save();
        // }
        //Adding tweet to the user tweets array
        let userPosted = await user.findById(userId);
        userPosted.tweets.push(createTweet);
        await userPosted.save();

        //Sending notifications to the tagged users
        if(taggedUsers)
        {
            for(let users of taggedUsers)
            {
                //finding the tagged user
                let mainUser = await user.findOne({username: users});
                //creating the activity 
                let activityUser = new activity({
                    sender: userPosted,
                    receiver: mainUser,
                    activityType: "tag",
                    tweet: createTweet
                })
                await activityUser.save()
                //creating the notification using the activity created above
                let notification = new notifications({
                    activity: activityUser,
                    notificationStream: `${userPosted.name} tagged you in a tweet`

                })
                //updating the date
                if(postedAt)
                    notification.createdAt =  new Date(postedAt);
                await notification.save();
                //pushing the notification to the array of the tagged user
                mainUser.notificationsArray.push(notification._id)
                mainUser.notificationFlag = true;
                await mainUser.save()
            }
        }
        //3ayzeen arg3lko eh?
        return res.status(200).json({succes: "true"})
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}



const isFollowing = async(mainUser, id)=>{
    if(mainUser.following){
        for(let oneUser of mainUser.following){
            if(oneUser.toString() == id.toString())
                return true;
        }
    }
    return false;
}
       



const getTweetUsingId = async(tweetId, userId)=>{
    let mainTweet  = await tweet.findById(tweetId);
    
    
    if(!mainTweet){
        throw new AppError('No tweet with this id', 500);
    }
    let getTweetUser = await user.findById(userId);
    if(!getTweetUser){
        throw new AppError('No tweet with this id', 500);
    }

    let mainUser = await user.findById(mainTweet.user.toString());

    let isLikedNew = false;
    if(getTweetUser.likedTweets){
        for(let likedTweet of getTweetUser.likedTweets){
            if((likedTweet).toString() === (mainTweet._id).toString())
                isLikedNew = true
        }
    }
    let isLiked = (isLikedNew)? "true" : "false";

    //Check if its retweeted by the main user

    let isRetweetedNew = false;
    if(getTweetUser.retweetedTweets){
        for(let retweetedTweet of getTweetUser.retweetedTweets){
            if((retweetedTweet).toString() === (mainTweet._id).toString())
                isRetweetedNew = true
        }
    }

    let isRetweeted = (!isRetweetedNew)? "false" : "true";

    //Check if it's bookmarked by the mainUser
    let isBookmarked = false;
    
    if(getTweetUser.bookMarkedTweets){
        for(let tweetBookmarked of getTweetUser.bookMarkedTweets){
            if((tweetBookmarked).toString() === (mainTweet._id).toString())
                isBookmarked = true
        }
    }

    

    //Checking if there is a pooll
    let poll = (mainTweet.poll)? "true" : "false";
    let firstChoice = "";
    let firstChoiceStats = 0;
    let secondChoice = "";
    let secondChoiceStats = 0;
    let thirdChoice = "";
    let thirdChoiceStats = 0;
    let fourthChoice = "";
    let fourthChoiceStats = 0;
    //Calculating the stats
    
    let pollChoice = -1;
    let newPoll;
    if(mainTweet.poll){
        let sum = 0;
        newPoll = await polls.findById(mainTweet.poll)
        if(newPoll.choice1){
            sum += newPoll.choice1Statistics.length;
            firstChoice = newPoll.choice1;
            for(let userVote of newPoll.choice1Statistics){
                if(getTweetUser._id.toString() === userVote._id.toString)
                    pollChoice = 1;
            }
        }
        if(newPoll.choice2){
            sum += newPoll.choice2Statistics.length;
            secondChoice =newPoll.choice2;
            if(pollChoice === -1){
                for(let userVote of newPoll.choice2Statistics){
                    if(getTweetUser._id.toString() === userVote._id.toString)
                        pollChoice = 2;
                }
            }
        }
        if(newPoll.choice3){
            sum += newPoll.choice3Statistics.length;
            thirdChoice = newPoll.choice3;
            if(pollChoice === -1){
                for(let userVote of newPoll.choice3Statistics){
                    if(getTweetUser._id.toString() === userVote._id.toString)
                        pollChoice = 3;
                }
            }
        }
        if(newPoll.choice4){
            sum +=newPoll.choice4Statistics.length;
            fourthChoice = newPoll.choice4;
            if(pollChoice === -1){
                for(let userVote of newPoll.choice4Statistics){
                    if(getTweetUser._id.toString() === userVote._id.toString)
                        pollChoice = 4;
                }
            }
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
    let isFollowingg = await isFollowing(getTweetUser, mainTweet.user)


    // writing the json file hat will be sent
    let usernamesTagged = []
    if(mainTweet.taggedUsers){
        for(let i of mainTweet.taggedUsers ){
            let userTagged = await user.findById(i)
            if(userTagged){
                usernamesTagged.push(userTagged.username);
            }
        }
    } 
    let data = {
        key:mainTweet._id,
        username: (mainUser).username,
        name: (mainUser).name,
        email: (mainUser).email,
        userImage: (mainUser).image,
        tweetBody: mainTweet.body,
        tweetMedia: mainTweet.media,
        repliesCount: (mainTweet.replies)? (mainTweet.replies).length: 0, 
        retweetersCount: (mainTweet.retweeters)?(mainTweet.retweeters).length : 0,
        favoritersCount: (mainTweet.favoriters)? (mainTweet.favoriters).length : 0,
        createdAt: mainTweet.createdAt,
        taggedUsers: usernamesTagged,
        isLikedByUser: isLiked,
        isRetweetedByUser: isRetweeted,
        isBookmarkedByUser: isBookmarked,
        poll: poll,
        firstChoice: firstChoice,
        firstChoiceStats: firstChoiceStats*100,
        numberOfVoters1: (newPoll)?newPoll.choice1Statistics.length:0,
        secondChoice: secondChoice,
        secondChoiceStats: secondChoiceStats*100,
        numberOfVoters2: newPoll?newPoll.choice2Statistics.length:0,
        thirdChoice: thirdChoice,
        thirdChoiceStats: thirdChoiceStats*100,
        numberOfVoters3: newPoll?newPoll.choice3Statistics.length:0,
        fourthChoice: fourthChoice,
        fourthChoiceStats: fourthChoiceStats*100,
        numberOfVoters4: newPoll?newPoll.choice4Statistics.length:0,
        userVotedOn: pollChoice,
        hashtags: mainTweet.hashtags,
        isReply: mainTweet.isReply,
        isQuoteRetweet: mainTweet.isQuoteRetweet,
        idOfTweetQuoted: (mainTweet.isQuoteRetweet)?mainTweet.idOfQuotedTweet:"",
        isRetweet: false,
        isFollowing: isFollowingg
        
    }
    //pushing it to the array.
    return data;
}
          







/**
 * @description This function is used to get the tweets of the user & his following list by using the token saved in the header
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} This returns all user tweets & the tweets his following list
 */

exports.getTweets = async(req, res)=>{
    const userId =req.user.id;
    try{
        //Find user tweets
        let dataSent = [];
        let sortedArray = [];
        let mainUser = await user.findById(userId);

        //the user requested
        let getTweetUser = mainUser;
      
       
        if(!mainUser)
            return res.status(500).json({error:"There is no user with this id!"});
        //Getting all tweets of the mainUser
        let tweets = mainUser.tweets;



        // adding the tweets of following list in the array of tweets 
        if(mainUser.following){
   
            for(let followedUser of mainUser.following){
                
                let userFollowed = await user.findById(followedUser)
                if(userFollowed.tweets && userFollowed.tweets.length!=0)
                    tweets = tweets.concat(userFollowed.tweets);
                if(userFollowed.quotedRetweets && userFollowed.quotedRetweets.length!=0)
                    tweets = tweets.concat(userFollowed.quotedRetweets);


                  
                    if(userFollowed.retweetedTweets){
                        for(let retweetMainUser of userFollowed.retweetedTweets){
                            let retweetActivity = await retweet.findOne({tweet: retweetMainUser, retweeter: followedUser._id })
                            let retweetOfUser = await tweet.findById(retweetMainUser)
                            if(retweetOfUser){
                                let dataOfRetweet = await getTweetUsingId(retweetMainUser,userId);
                                let data  = dataOfRetweet
                                data.usernameRetweeter= userFollowed.username,
                                data.imageRetweeter= userFollowed.image,
                                data.nameRetweeter= userFollowed.name,
                                data.createdAt= (retweetActivity)? retweetActivity.createdAt:new Date(2022/3/1),
                                data.isRetweet= true
                                dataSent.push(data);
                            }
                            
                        }
                    }
            }
        }
        if(mainUser.quotedRetweets){
            tweets = tweets.concat(mainUser.quotedRetweets)
        }
        
        if(mainUser.retweetedTweets){
            for(let retweetMainUser of mainUser.retweetedTweets){
                let retweetActivity = await retweet.findOne({tweet: retweetMainUser, retweeter: mainUser._id })

                let retweetOfUser = await tweet.findById(retweetMainUser)
                if(retweetOfUser){
                    let dataOfRetweet = await getTweetUsingId(retweetMainUser,userId);
                    let data  = dataOfRetweet
                    data.usernameRetweeter= mainUser.username,
                    data.imageRetweeter= mainUser.image,
                    data.nameRetweeter= mainUser.name,
                    data.createdAt= (retweetActivity)? retweetActivity.createdAt:new Date(2022/3/1),
                    data.isRetweet= true
                    dataSent.push(data);
                }
                
            }
        }
        // loop on tweeets
        if(tweets){
            for(let i of tweets){
                //Is The tweet written by the user & not reply & not a quoted tweet?
                let mainTweet = await tweet.findById(i);
                let date = new Date();
                if(mainTweet && (mainTweet.createdAt <= date) && !mainTweet.isReply){
                    
                    mainUser = await user.findById(mainTweet.user)
                    //Creating objects that will be sent in json file
                    
                    let data = await getTweetUsingId(i, userId);
                    //pushing it to the array.
                    dataSent.push(data);
                }
            }
        }
        



       //Sorting the array
        if(dataSent && dataSent.length>0){
            sortedArray = dataSent.sort(function(a, b){

                return new Date(b.createdAt ) - new Date(a.createdAt ) ;
            })
        }  
        //3ayzeen retweets terga3?
        return res.status(200).json({data: sortedArray, succes: "true", userImage: getTweetUser.image, isAdmin: getTweetUser.isAdmin, userName: getTweetUser.username,name:getTweetUser.name});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}

/**
 * @description This function is used to like/unlike a tweet and saves user id in the database
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} returns the status (failed/success) and the liked tweet 
 */

exports.likeTweet = async(req, res)=>{
    const userId =req.user.id;

    const tweetId = req.params.tweetId;

    try{
        //Find tweet by using id sent
        let tweetLiked = await tweet.findById(tweetId);
        
        //If this tweet is deleted
        if(!tweetLiked){
            
            return res.status(404).json({ error: 'tweet not found' })
        }
        
        //Searching for user id in facorited array
        const index = tweetLiked.favoriters.indexOf(userId)
    
        //If found then user is trying to unlike the tweet
        if(index !== -1){
           
            //Delete user id from the array
            tweetLiked.favoriters.splice(index, 1);
            await tweetLiked.save();
     

            let tweetOfUser = await user.findById(tweetLiked.user);
            let userLiked  = await user.findById(userId);
            
            
            let index3 = userLiked.likedTweets.indexOf(tweetId)

            if(index3!==-1){
                userLiked.likedTweets.splice(index3, 1);  
                await userLiked.save();
              
            }
            let activityUser = await activity.findOne({sender: userLiked, receiver: tweetOfUser, activity: "like", tweet: tweetLiked});
            
            let notification = await notifications.findOne({activity: activityUser})
            
            let index2 = tweetOfUser.notificationsArray.indexOf(notification._id)
            if(index2!==-1){
                tweetOfUser.notificationsArray.splice(index2, 1);
                //await tweetOfUser.save();
            }
            if(activityUser)
                await activity.findByIdAndDelete(activityUser._id);
            if(notification)
                await notifications.findByIdAndDelete(notification._id);

            
      
            return res.status(200).json({message: "removed like"});
        }


        //If not found then user is trying to like the tweet
         tweetLiked.favoriters.push(userId);
         
         //3ayza ashof el satr el gy da by3mel eh
         //tweetLiked.user = userId;
        await tweetLiked.save();

        //Send notifications
        let tweetOfUser = await user.findById(tweetLiked.user);
        let userLiked  = await user.findById(userId);

        userLiked.likedTweets.push(tweetId);
        await userLiked.save();
        //creating the activity 
         let activityUser = new activity({
             sender: userLiked,
             receiver: tweetOfUser,
             activityType: "like",
             tweet: tweetLiked
         })
         await activityUser.save()
         //creating the notification using the activity created above
         let notification = new notifications({
             activity: activityUser,
             notificationStream: `${userLiked.name} liked your tweet`

         })
        //  //updating the date
        
         await notification.save();
         
         //pushing the notification to the array of the tagged user
         tweetOfUser.notificationsArray.push(notification._id)
         tweetOfUser.notificationFlag = true;
         await tweetOfUser.save()


        return res.status(200).json({message: "added like", notificationFlag: tweetOfUser.notificationFlag});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
};


//Tagreba can be deleted
exports.createUser= async(req, res)=>{
    const {username, email, password, name, birthdate, country, city, following} = req.body;
    try{
    let createUser = new user({
        username: username, 
        email: email,
        password:password,
        name: name,
        birthdate: birthdate,
        country: country,
        city: city,
        following: following,
        confirmEmailToken: "true"
        
    });
    await createUser.save();
    return res.status(200).json({succes: "true"})
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
 }

 //Tagreba can be deleted
 exports.createTweet= async(req, res)=>{
     const {user, body} = req.body;
     try{
     let createTweet = new tweet({
        //media,
        body: body,
        user: user
        
    });

    await createTweet.save();
    return res.status(200).json({succes: "true"})
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
 }

 //For simplicity
 exports.showUsers=  async(req, res)=>{
     let users = await user.find({});
     let tweets = await tweet.find({});
     let notificationss = await notifications.find({});
     let activities = await activity.find({})
    return res.status(200).json({message: "Retweeted successfully", tweets: tweets, users: users, notificationss: notificationss, activities: activities});
 }


 /**
  * @description This function is used to retweet a tweet and saves user id in the database
  * @param {String} tweetId 
  * @param {String} userId 
  * @returns {Object}
  */
const makeRetweetFunc = async(tweetId, userId, msg)=>{

    //Find the tweet by using the tweet id
        let retweetedTweet = await tweet.findById(tweetId);
 
        
        //If the post is deleted or not found
        if(!retweetedTweet){   
            throw new AppError('No tweet with this id', 500);
        }

         //Adding the retweet to the user
         let userRetweeted = await user.findById(userId);

         
         //User id is not found
         if(!userRetweeted){   
             throw new AppError('No user with this id', 500);
         }

        //Search if this user retweeted this tweet
        const isFoundUser = retweetedTweet.retweeters.indexOf(userId);

        let userPostedTweet = await user.findById(retweetedTweet.user.toString());
        //If it's the first time to retweet 
        if(isFoundUser === -1){
            retweetedTweet.retweeters.push(userId);
           
            //retweetedTweet.user = userId;
            await retweetedTweet.save();

            // creating teh activity to add it in the notification
            let activityUser = new activity({
                sender: userRetweeted,
                receiver: userPostedTweet,
                activityType: "retweet",
                tweet: retweetedTweet
            })
            await activityUser.save()
            //creating the notification using the activity created above
            let notification = new notifications({
                activity: activityUser,
                notificationStream: `${userRetweeted.name} retweeted your tweet`

            })
            await notification.save()

            //Pushing the notification to the user who posted the tweet
            userPostedTweet.notificationsArray.push(notification._id)
            userPostedTweet.notificationFlag = true;
            await userPostedTweet.save()


            //Adding retweet to retweet model
            let newRetweet = new retweet({
                retweeter: userId,
                tweet: tweetId
            })
            await newRetweet.save();
            //Adding the retweet to the user 
            userRetweeted.retweetedTweets.push(tweetId);
            await userRetweeted.save();
            msg = "Retweeted successfully";
        }
        else{
            retweetedTweet.retweeters.splice(isFoundUser, 1);
            await retweetedTweet.save();
          


            let index = userRetweeted.retweetedTweets.indexOf(tweetId);
            //nafs el codeee harfyan nafso ahh 3ahsan splice tshtghal we hwa bykhosh sah

            if(index !== -1){
                userRetweeted.retweetedTweets.splice(index, 1);
                await userRetweeted.save(); //ehh el habal da ssanya
            }

            let activityRetweet = await activity.findOne({sender: userRetweeted,
                receiver: userPostedTweet,
                activityType: "retweet",
                tweet: retweetedTweet});

            let notificationRetweet;
            if(activityRetweet){
                notificationRetweet = await notifications.findOne({activity: activityRetweet})
            }

            let retweetActivity = await retweet.findOne({tweet: tweetId, retweeter: userId });
            if(retweetActivity)
                await retweet.findByIdAndDelete(retweetActivity._id);
            

            if(notificationRetweet)
                await notifications.findByIdAndDelete(notificationRetweet._id);
            
            msg = "Retweet removed";

        }
        
        return msg;
}
 exports.makeRetweetFunc =makeRetweetFunc

 exports.makeRetweet = async(req, res)=>{
    const tweetId = req.params.tweetId;
    const userId =req.user.id;

    try{    
       let msg = "";
        const userRetweeted = await makeRetweetFunc(tweetId, userId, msg);

        //Retweeted successfully
        return res.status(200).json({message: userRetweeted});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

 } 



/**
 * @description This function is used to make reply on a tweet using tweet it sent in the parameter
 * @param {String} userId 
 * @param {String} body 
 * @param {String} tweetId 
 * @param {String} media 
 * @param {String} taggedUsers 
 * @returns {Object} 
 */

 const makeReplyFunc = async(userId, body, tweetId, media, taggedUsers)=>{
     
        //Reply is a tweet so we have to make the tweet first
        let createdTweet = new tweet({
            user: userId,
            isReply: true    
            });

            let replier = user.findById(userId);
            console.log(replier);
            //Adding body if exists
            if(body)
                createdTweet.body = body;
            //Adding media/taggedUsers if exists
            if(taggedUsers)
                createdTweet.taggedUsers = taggedUsers;
            if(media)
                createdTweet.media=media;
    
    
            //Then we have to find the tweet the user is trying to reply on it
            var retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
            
            //If the post is deleted or not found
            if(!retweetedTweet){   
                throw new AppError('No tweet with this id', 500);
            }
    
            // save it in the datebase to find it by tweet id saved in replies
            await createdTweet.save();
            //Then we must add tweet created to the retweetedTweet's replies
            retweetedTweet.replies.push(createdTweet);
            replier.push(createdTweet._id);
            await replier.save();
            await retweetedTweet.save();
            return retweetedTweet
 }
 exports.makeReplyFunc =makeReplyFunc


 exports.makeReply = async(req, res) =>{
    const {body,  media, taggedUsers, hashtags} = req.body;
    const tweetId = req.params.tweetId;
    const userId =req.user.id;
    //const mediaUploaded = req.files.image.data;

    //Checking on the content of the comment
    if(!body&& !media && !taggedUsers && !hashtags){
        return res.status(422).json({error: "Please enter data to reply!"});
    }
    try{
        //Checking the length of media
        if(media&&media.length>4)
            return res.status(500).json({error:"The media must be less than 5"});
        
        //Checking the count of the tagged users
        if(taggedUsers && taggedUsers.length>10)
             return res.status(500).json({error:"Can't tag more than 10 users!"});

        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        //If the post is deleted or not found
        if(!retweetedTweet){   
            return res.status(404).json({ error: 'Tweet not found' })
        }
        //Reply is a tweet so we have to make the tweet first
        let createdTweet = new tweet({
        user: userId,
        isReply: true    
        });
        let replier = await user.findById(userId.toString());
        console.log(replier);

        //Adding body if exists
        if(body)
            createdTweet.body = body;

        if(hashtags)
            createdTweet.hashtags =hashtags
        //Adding media/taggedUsers if exists
        let taggedUsersIds=[]
        if(taggedUsers){
            for(let i of taggedUsers){
                let userTagged = await user.findOne({username: i});
                if(userTagged){
                    taggedUsersIds.push(userTagged._id)
                }
            }
            createdTweet.taggedUsers = taggedUsersIds;
        }
        if(media)
            createdTweet.media=media;
        // save it in the datebase to find it by tweet id saved in replies
        replier.tweets.push(createdTweet._id);
        await replier.save();
        await createdTweet.save();
        //Then we have to find the tweet the user is trying to reply on it

        // if(mediaUploaded){
        //     const imgObjects = await uploadIMG(
        //         mediaUploaded,
        //         'tweet',
        //         createdTweet._id
        //     );
        //     createdTweet.media = imgObjects;
        //     await createdTweet.save();
        // }
        //Add
        

        // sending notification to the tagged users
        if(taggedUsers){
            let userPosted = await user.findById(userId)
            for(let i of taggedUsersIds){
                let mainUser = await user.findById(i);
                //creating the activity 
                let activityUser = new activity({
                    sender: userPosted,
                    receiver: mainUser,
                    activityType: "tag",
                    tweet: createdTweet
                })
                await activityUser.save()
                //creating the notification using the activity created above
                let notification = new notifications({
                    activity: activityUser,
                    notificationStream: `${userPosted.name} tagged you in a reply`

                })
                //updating the date
                await notification.save();
                //pushing the notification to the array of the tagged user
                mainUser.notificationsArray.push(notification._id)
                mainUser.notificationFlag = true;
                await mainUser.save()
    

            }
        }


        //Sending notification to the one who posted the tweet
        let userPostedTweet = await user.findById(retweetedTweet.user)
        let userReplied = await user.findById(userId);
        let activityUser = new activity({
            sender: userReplied,
            receiver: userPostedTweet,
            activityType: "reply",
            tweet: retweetedTweet
        })
        await activityUser.save()

        let notification = new notifications({
            activity: activityUser,
            notificationStream: `${userReplied.name} replied on your tweet`

        })
        await notification.save();

        //pushing the notification to the array of the tagged user
        userPostedTweet.notificationsArray.push(notification._id)
        userPostedTweet.notificationFlag = true;
        await userPostedTweet.save()

        //Then we must add tweet created to the retweetedTweet's replies
        retweetedTweet.replies.push(createdTweet);
        await retweetedTweet.save();
        return res.status(200).json({message: "Replied successfully"});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
 } 


 exports.makeQuoteRetweet= async(req, res)=>{
    const {body,  media, taggedUsers, hashtags} = req.body;
    const tweetId = req.params.tweetId;
    const userId =req.user.id;
    //const mediaUploaded = req.files.image.data;

    
    //Checking on the content of the quoteRetweet
    if(!body&& !media && !taggedUsers && !hashtags){
        return res.status(422).json({error: "Please enter data to reply!"});
    }


    try{

        //Checking the length of media
        if(media&&media.length>4)
            return res.status(500).json({error:"The media must be less than 5"});
        
        //Checking the count of the tagged users
        if(taggedUsers && taggedUsers.length>10)
             return res.status(500).json({error:"Can't tag more than 10 users!"});

        let retweetedTweet = await tweet.findById(tweetId);
        
        //If the post is deleted or not found
        if(!retweetedTweet){   
            return res.status(404).json({ error: 'Tweet not found' })
        }
        //QuoteRetweet is a tweet so we have to make the tweet first
        let createdTweet = new tweet({
        user: userId,
        isQuoteRetweet: true    
        });

        if(body)
            createdTweet.body = body;

        if(hashtags)
            createdTweet.hashtags = hashtags
        //Adding media/taggedUsers if exists
        let taggedUsersIds=[]
        if(taggedUsers){
            for(let i of taggedUsers){
                let userTagged = await user.findOne({username: i});
                if(userTagged){
                    taggedUsersIds.push(userTagged._id)
                }
            }
            createdTweet.taggedUsers = taggedUsersIds;
        }
        if(media)
            createdTweet.media=media;
        // save it in the datebase to find it by tweet id saved in replies

        createdTweet.idOfQuotedTweet = tweetId;
        await createdTweet.save();


        // if(mediaUploaded){
        //     const imgObjects = await uploadIMG(
        //         mediaUploaded,
        //         'tweet',
        //         createdTweet._id
        //     );
        //     createdTweet.media = imgObjects;
        //     await createdTweet.save();
        // }


        if(taggedUsers){
            let userPosted = await user.findById(userId)
            for(let i of taggedUsersIds){
                let mainUser = await user.findById(i);
                //creating the activity 
                let activityUser = new activity({
                    sender: userPosted,
                    receiver: mainUser,
                    activityType: "tag",
                    tweet: createdTweet
                })
                await activityUser.save()
                //creating the notification using the activity created above
                let notification = new notifications({
                    activity: activityUser,
                    notificationStream: `${userPosted.name} tagged you in a quoted retweet`

                })
                //updating the date
                await notification.save();
                //pushing the notification to the array of the tagged user
                mainUser.notificationsArray.push(notification._id)
                mainUser.notificationFlag = true;
                await mainUser.save()
    

            }
        }


        //Sending notification to the one who posted the tweet
        let userPostedTweet = await user.findById(retweetedTweet.user)
        let userRetweeted = await user.findById(userId);
        let activityUser = new activity({
            sender: userRetweeted,
            receiver: userPostedTweet,
            activityType: "quoteRetweet",
            tweet: retweetedTweet
        })
        await activityUser.save()

        let notification = new notifications({
            activity: activityUser,
            notificationStream: `${userRetweeted.name}  retweeted with quote on your tweet`

        })
        await notification.save();

        //pushing the notification to the array of the tagged user
        userPostedTweet.notificationsArray.push(notification._id)
        userPostedTweet.notificationFlag = true;
        await userPostedTweet.save();


         //Adding the retweet to the user 
         userRetweeted.quotedRetweets.push(createdTweet._id);
         await userRetweeted.save();


         //Search if this user retweeted this tweet
        const isFoundUser = retweetedTweet.quotedRetweets.indexOf(userId);


        //If it's the first time to retweet 
        if(isFoundUser === -1){
            retweetedTweet.quotedRetweets.push(createdTweet._id);  
            //retweetedTweet.user = userId;
            await retweetedTweet.save();
        }


        return res.status(200).json({message: "Retweeted with quote successfully", tweet: retweetedTweet});

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

 }


/**
 *  @description This function is used to know who retweeted this tweet(tweet id is sent in the parameters)
 * @param {Object} usersRetweeters 
 * @returns Returns the users who retweeted a tweet
 */

const getRetweetsFunc = async(usersRetweeters)=>{
  
        let dataUsers = [];
        if(usersRetweeters){
            for(let i of usersRetweeters){
                let user1 = await user.findById(i);
                //Adding data that will be sent using json file
                if(user1){
                    let userData = {
                        username : user1.username,
                        name: user1.name,
                        email: user1.email,
                        image: user1.image
                    }
                
                    //Pushing data to the array
                    dataUsers.push(userData);
                }
            }
        }
        return dataUsers;
}
exports.getRetweetsFunc = getRetweetsFunc

//Get retweets of a tweet by tweetId
exports.getRetweeters = async(req, res) =>{
    const tweetId = req.params.tweetId;
    try{
        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        //If this tweet is deleted
        if(!retweetedTweet){
            return res.status(404).json({ error: 'tweet not found' })
        }
        //Getting userRetweeters 
        let usersRetweeters = retweetedTweet.retweeters;
        let dataUsers = [];
        if(usersRetweeters){
            for(let i of usersRetweeters){
                let user1 = await user.findById(i);
                //Adding data that will be sent using json file
                let userData = {
                    username : user1.username,
                    name: user1.name,
                    email: user1.email,
                    image: user1.image
                }
                //Pushing data to the array
                dataUsers.push(userData);
            }
        }
        return res.status(200).json({message: "Success", users: dataUsers, count: usersRetweeters.length});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
 }


exports.getRetweetsUser= async(req, res)=>{
    const userId =req.user.id;

    try{
        let mainUser = await user.findById(userId)
        if(!mainUser)
            return res.status(404).json({ error: 'user not found' });
        
        let retweetedTweets = mainUser.retweetedTweets;
        return res.status(200).json({message: "Success",retweetedTweets: retweetedTweets});



    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}

/**
 * @description This function is used to know who liked this tweet(tweet id is sent in the parameters)
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Returns the users who liked this tweet
 */

 
exports.getLikers = async(req, res) =>{
    const tweetId = req.params.tweetId;
    try{
        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        //If this tweet is deleted
         if(!retweetedTweet){ 
            return res.status(404).json({ error: 'tweet not found' })
        }
        //Getting the users who liked the tweets
        let userlikers = retweetedTweet.favoriters;
        let dataUsers = [];
        if(userlikers){
            for(let i of userlikers){
                let user1 = await user.findById(i);
                //Adding data that will be sent using json file
                let userData = {
                    username : user1.username,
                    name: user1.name,
                    email: user1.email,
                    image: user1.image,
                    bio: user1.bio
                }
                //Pushing data to the array
                dataUsers.push(userData);
            }
        }
        return res.status(200).json({message: "Success", users: dataUsers, count: userlikers.length});

       
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
    
}

/**
 * @description This function is used to know who are tagged in a tweet(tweet id is sent in the parameters)
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Returns the users who are tagged in a tweet
 */

exports.getTaggedUsers = async(req, res) =>{
    const tweetId = req.params.tweetId;
    try{
        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        //If this tweet is deleted
        if(!retweetedTweet){
            return res.status(404).json({ error: 'tweet not found' })
        }

        //Getting the users who are tagged in the tweet
        let usersTagged = retweetedTweet.taggedUsers;
        let dataUsers = [];
        if(usersTagged){
            for(let i of usersTagged){
                let user1 = await user.findById(i);
                //Adding data that will be sent using json file
                let userData = {
                    username : user1.username,
                    name: user1.name,
                    email: user1.email,
                    image: user1.image
                }
                //Pushing data to the array
                dataUsers.push(userData);
            }
        }
        return res.status(200).json({message: "Success", users: dataUsers, count: usersTagged.length});

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
    
}


/**
 * @description This function is used to get the replies of a certain tweet (tweet id is sent in the header)
 * @param {*} req 
 * @param {*} res 
 * @returns {Object} Returns the replies on a tweet
 */


exports.getReplies = async(req, res) =>{
    const tweetId = req.params.tweetId;
    const userId =req.user.id;


    try{
        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });

         //If this tweet is deleted
        if(!retweetedTweet){
            return res.status(404).json({ error: 'tweet not found' })
        }

        //Getting the tweets(replies)
        let replies = retweetedTweet.replies;
        let dataUsers = [];
        if (replies){
            for(let i of replies){
                let replyOfUser = await tweet.findById(i);
                if(replyOfUser){
                    let taggedUsernames = []
                    if(replyOfUser.taggedUsers){
                        for(let taggedUser of replyOfUser.taggedUsers){
                            let userT = await user.findById(taggedUser);
                            if(userT)
                                taggedUsernames.push(userT.username);
                        }
                    }
                    let user1 = await user.findById(replyOfUser.user);

                    let mainUser = await user.findById(userId)
                    let isLikedNew = false;
                    if(mainUser.likedTweets){
                        for(let likedTweet of mainUser.likedTweets){
                            if((likedTweet).toString() === (replyOfUser._id).toString())
                                isLikedNew = true
                        }
                    }
                    let isLiked = (isLikedNew)? "true" : "false";

                    //Check if its retweeted by the main user
             
                    let isRetweetedNew = false;
                    if(mainUser.retweetedTweets){
                        for(let retweetedTweetReply of mainUser.retweetedTweets){
                            if((retweetedTweetReply).toString() === (replyOfUser._id).toString())
                                isRetweetedNew = true
                        }
                    }
                
                    let isRetweeted = (!isRetweetedNew)? "false" : "true";

                    //Check if it's bookmarked by the mainUser
                    let isBookmarked = "false";
                    
                    if(mainUser.bookMarkedTweets){
                        for(let tweetBookmarked of mainUser.bookMarkedTweets){
                            if((tweetBookmarked).toString() === (replyOfUser._id).toString())
                                isBookmarked = "true"
                        }
                    }

                    //Adding data that will be sent using json file
                    let data = {
                        key: i,
                        username: user1.username,
                        name: user1.name,
                        email: user1.email,
                        image: user1.image,
                        replyBody: replyOfUser.body,
                        createdAt: replyOfUser.createdAt,
                        updatedAt: replyOfUser.updatedAt,
                        taggedUsers: taggedUsernames,
                        media: replyOfUser.media,
                        repliesCount: (replyOfUser.replies)?replyOfUser.replies.length:0,
                        retweetersCount: (replyOfUser.retweeters)?replyOfUser.retweeters.length:0,
                        favoritersCount: (replyOfUser.favoriters)?replyOfUser.favoriters.length:0,
                        isReply: replyOfUser.isReply,
                        hashtags: replyOfUser.hashtags,
                        isLikedByUser: isLiked,
                        isRetweetedByUser: isRetweeted,
                        isBookmarkedByUser: isBookmarked
                    }
                    //Pushing data to the array
                    dataUsers.push(data);
                }
            }
        }
        return res.status(200).json({message: "Success", Replies: dataUsers, count: replies.length}); 
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
    
}


exports.getNotifications = async(req, res) =>{
    const userId =req.user.id;

    try{
        let mainUser = await user.findById(userId);

        let notificationsSent = [];
        if(!mainUser)
            return res.status(404).json({ error: 'user not found' })
        
        let notificationsArray = mainUser.notificationsArray;
        let countOfNewNotifications = 0
        if(notificationsArray){
            for(let notification of notificationsArray){
                let mainNotification = await notifications.findById(notification);
                let date  = new Date()
                if(mainNotification && mainNotification.createdAt <= date){
                    let mainActivity = await activity.findById(mainNotification.activity);
           
                    let mainTweetNotification;
                    if(mainActivity.tweet){
                        mainTweetNotification = await tweet.findById(mainActivity.tweet);
                    }
                    let senderUser = await user.findById(mainActivity.sender);
                    let obj = {
                        notificationId : mainNotification._id,
                        sender: (senderUser).username,
                        imageSender: senderUser.image,
                        receiver:(await user.findById( mainActivity.receiver)).username,
                        activity: mainActivity.activityType,
                        tweetId: mainActivity.tweet,
                        mainString: mainNotification.notificationStream,
                        createdAt:  mainNotification.createdAt,
                        status: mainNotification.status,
                        tweetBody: (mainTweetNotification)? mainTweetNotification.body:""
                    }
                    if((await user.findById(mainActivity.sender)).username !== (await user.findById( mainActivity.receiver)).username){
                        if( mainNotification.status)
                            countOfNewNotifications++
                        notificationsSent.push(obj);
                    }

                }

            }
        }

        let sortedArray = []
        //Sorting the array
        if(notificationsSent && notificationsSent.length>0){
            sortedArray = notificationsSent.sort(function(a, b){

                return new Date(b.createdAt ) - new Date(a.createdAt ) ;
            })
        }
        mainUser.notificationFlag = false;
        await mainUser.save()
        return res.status(200).json({message: "Success", notificationsArray: sortedArray, countOfNewNotifications: countOfNewNotifications,notificationFlag: mainUser.notificationFlag }); 

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}


exports.makePollChoice = async (req, res)=>{
    const userId =req.user.id;
    const tweetId = req.params.tweetId;
    const {choiceNumber} = req.body

    try{
        let pollTweet = await tweet.findById(tweetId)
        if(!pollTweet)
            return res.status(404).json({ error: 'tweet not found' })
        
        if(!pollTweet.poll)
            return res.status(404).json({ error: 'there is no poll in this tweet' })
        
        
        let pollNew = await poll.findById(pollTweet.poll);
        if(!pollNew)
            return res.status(404).json({ error: 'cannot find the poll' })
      
        let index;
        if(choiceNumber == "1"){
            index = pollNew.choice1Statistics.indexOf(userId)
            if( index == -1){
                pollNew.choice1Statistics.push(userId);
                if(pollNew.choice2Statistics){
                    let ind = pollNew.choice2Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice2Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice3Statistics){
                    let ind = pollNew.choice3Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice3Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice4Statistics){
                    let ind = pollNew.choice4Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice4Statistics.splice(ind, 1);
                    }
                }


            }
            else
                pollNew.choice1Statistics.splice(index, 1);
        }
        
        if(choiceNumber == "2"){
            index = pollNew.choice2Statistics.indexOf(userId)
            if( index == -1){
                pollNew.choice2Statistics.push(userId);
                if(pollNew.choice1Statistics){
                    let ind = pollNew.choice1Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice1Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice3Statistics){
                    let ind = pollNew.choice3Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice3Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice4Statistics){
                    let ind = pollNew.choice4Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice4Statistics.splice(ind, 1);
                    }
                }

            }
            else
                pollNew.choice2Statistics.splice(index, 1);
        }

        if(choiceNumber == "3"){
            index = pollNew.choice3Statistics.indexOf(userId)
            if( index == -1){
                pollNew.choice3Statistics.push(userId);
                if(pollNew.choice1Statistics){
                    let ind = pollNew.choice1Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice1Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice2Statistics){
                    let ind = pollNew.choice2Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice2Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice4Statistics){
                    let ind = pollNew.choice4Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice4Statistics.splice(ind, 1);
                    }
                }
            }
            else
                pollNew.choice3Statistics.splice(index, 1);
        }
        
        if(choiceNumber == "4"){
            index = pollNew.choice4Statistics.indexOf(userId)
            if( index == -1){
                pollNew.choice4Statistics.push(userId);
                if(pollNew.choice1Statistics){
                    let ind = pollNew.choice1Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice1Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice2Statistics){
                    let ind = pollNew.choice2Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice2Statistics.splice(ind, 1);
                    }
                }
                if(pollNew.choice3Statistics){
                    let ind = pollNew.choice3Statistics.indexOf(userId)
                    if(ind !==-1){
                        pollNew.choice3Statistics.splice(ind, 1);
                    }
                }
            }
            else
                pollNew.choice4Statistics.splice(index, 1);
        }
          

        await pollNew.save();

        let mainUser = await user.findById(userId)
        let userOfTweet = await user.findById(pollTweet.user)
        if(index == -1){
            let activityUser = new activity({
                    sender: mainUser,
                    receiver: userOfTweet,
                    activityType: "vote",
                    tweet: pollTweet
                })
                await activityUser.save()
            
                //creating the notification using the activity created above
                let notification = new notifications({
                    activity: activityUser,
                    notificationStream: `${mainUser.name} voted on your poll`

                })
                //updating the date
                await notification.save();
                //pushing the notification to the array of the tagged user
                userOfTweet.notificationsArray.push(notification._id)
                userOfTweet.notificationFlag = true;
                await userOfTweet.save();
        }
        else{
            let activityUser = await activity.findOne({sender: mainUser, receiver: userOfTweet, activity: "vote", tweet: pollTweet});
          
            let notification = await notifications.findOne({activity: activityUser})

            if(notification){
                const index2 = userOfTweet.notificationsArray.indexOf(notification._id)
                if(index2!==-1){
                    userOfTweet.notificationsArray.splice(index2, 1);
                    await userOfTweet.save();
                }
                if(activityUser)
                    await activity.findByIdAndDelete(activityUser._id);
                if(notification)
                    await notifications.findByIdAndDelete(notification._id);
                }

        }

            return res.status(200).json({message: "Success", poll: pollNew})

        

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}


exports.bookmarkTweet = async(req, res)=>{
    const userId =req.user.id;
    const tweetId = req.params.tweetId;

    try{
        let mainTweet = await tweet.findById(tweetId);
        let mainUser = await user.findById(userId);

        if(!mainTweet)
            return res.status(404).json({ error: 'tweet not found' });

        if(!mainUser)
            return res.status(404).json({ error: 'user not found' });
        
        let index = mainUser.bookMarkedTweets.indexOf(tweetId)
        if(index !== -1){
            mainUser.bookMarkedTweets.splice(index, 1)
        }
        else{
            mainUser.bookMarkedTweets.push(tweetId)
        }
        await mainUser.save();
        return res.status(200).json({message: "Success", bookmarkedTweetsOfUser: mainUser.bookMarkedTweets})

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}

exports.getBookmarkedTweets = async(req, res)=>{
    const userId =req.user.id;
    try{
        let mainUser = await user.findById(userId);
        if(!mainUser)
            return res.status(404).json({ error: 'user not found' });
        
        let bookmarkedTweets = mainUser.bookMarkedTweets;
        return res.status(200).json({message: "Success", bookmarkedTweets: bookmarkedTweets})

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}

exports.deleteBookmarkedTweets = async(req, res)=>{
    const userId =req.user.id;
    try{
        let mainUser = await user.findById(userId);
        if(!mainUser)
            return res.status(404).json({ error: 'user not found' });
        
        mainUser.bookMarkedTweets = [];
        await mainUser.save();
        return res.status(200).json({message: "Success"})

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}

exports.deleteNotification = async(req, res)=>{
    const userId =req.user.id;
    const notificationId = req.params.notificationId;

    try{
        let notificationDeleted = await notifications.findById(notificationId)
        if(!notificationDeleted)
             return res.status(404).json({ error: 'notification not found' });
        let activityDelete = await activity.findById(notificationDeleted.activity)
        let userNotification = await user.findById(userId);
        let index = userNotification.notificationsArray.indexOf(notificationId)
        if(index!==-1){
            userNotification.notificationsArray.splice(index, 1);
            await userNotification.save();
        }
        if(activityDelete){
            await activity.findByIdAndDelete(activityDelete._id);
        }
        await notifications.findByIdAndDelete(notificationDeleted._id)

        return res.status(200).json({message: "deleted successfully"})

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}


exports.deleteTweet = async(req, res)=>{
    const userId =req.user.id;
    const tweetId = req.params.tweetId;
    try{
        let mainTweet = await tweet.findById(tweetId);
        let mainUser = await user.findById(userId);
        if(!mainTweet)
            return res.status(404).json({ error: 'tweet not found' });
        if(mainUser._id.toString()!==mainTweet.user._id.toString())
             return res.status(404).json({ error: ' This tweet is posted by another user cannot be deleted' });

            
    
        let index = (mainUser.tweets).indexOf(tweetId)
        if(index!==-1){
            mainUser.tweets.splice(index, 1);
            await mainUser.save();
        }

        await tweet.findByIdAndDelete(mainTweet._id);
        return res.status(200).json({message: "deleted successfully"})
    }   
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}

exports.getTweetById = async(req, res)=>{
    const tweetId = req.params.tweetId;
    const userId =req.user.id;
    try{
        let mainTweet = await tweet.findById(tweetId)
        if(!mainTweet)
            return res.status(404).json({ error: 'Tweet not found' });
        let data =await getTweetUsingId(tweetId, userId);
        return res.status(200).json({message: "Success", tweetData: data})

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}


exports.patchNotification = async(req, res)=>{
    const notificationId = req.params.notificationId;

    try{
        let mainNotification = await notifications.findById(notificationId);
        if(!mainNotification)
            return res.status(404).json({ error: 'Notification not found' });
        
        mainNotification.status = false;
        await mainNotification.save();

        return res.status(200).json({message: "Success"})

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
}

