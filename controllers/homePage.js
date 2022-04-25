const express = require('express'); 
const user = require('../models/user');
const tweet = require('../models/tweet');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */

exports.postTweet = async(req, res)=>{
    const {body, media, taggedUsers} = req.body;
    const userId =req.user.id;

    //Checking if there is something to post.
    if(!body && !media && !taggedUsers){
        return res.status(422).json({error: "Please enter data to post the tweet!"});
    }
    
    try{
        //Checking the count of media.
        if(media&&media.length>4)
            return res.status(500).json({error:"The media must be less than 5"});

        let createTweet = new tweet({
            user: userId  
        });
      
        //Can I tag myself?
        //Checking the count of tagged users
        if(taggedUsers && taggedUsers.length>10)
            return res.status(422).json({error: "Can't tag more than 10 users!"});

        // Adding body/taggedUsers/media if exist
        if(body)
            createTweet.body = body;
        if(taggedUsers)
            createTweet.taggedUsers = taggedUsers;
        if (media)
            createTweet.media = media;
        //Saving tweet to database
        await createTweet.save();
        return res.status(200).json({succes: "true", tweet: createTweet})
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}

exports.getTweets = async(req, res)=>{
    const userId =req.user.id;
    try{
        //Find user tweets
        let dataSent = [];
        let sortedArray = [];
        let mainUser = await user.findById(userId);
        console.log(mainUser);
        if(!mainUser)
            return res.status(500).json({error:"There is no user with this id!"});
        //Getting all tweets
        let tweets = await tweet.find({});
        if(tweets){
            for(let i of tweets){
                //Is The tweet written by the user & not reply?
                if(i.user==userId && !i.isReply){
                    userTweet = await user.findById(i.user);
                    //Creating objects that will be sent in json file
                    let data = {
                        key:i._id,
                        username: (userTweet).username,
                        name: (userTweet).name,
                        email: (userTweet).email,
                        userImage: (userTweet).image,
                        tweetBody: i.body,
                        tweetMedia: i.media,
                        repliesCount: (i.replies).length, 
                        retweetersCount: (i.retweeters).length,
                        favoritersCount: (i.favoriters).length,
                        updatedAt: i.updatedAt,
                        createdAt: i.createdAt,
                        taggedUsers: i.taggedUsers
                    }
                    //pushing it to the array.
                    dataSent.push(data);
                }
            }
        }
        //Find the tweets of the followers
        let userFollowers =mainUser.following;
        if(userFollowers){
            for(let i of userFollowers){
                let user1 = await user.findById(i);
                if(tweets){
                    for(let j of tweets){
                        let user2 = await user.findById(j.user);
                        if(!j.isReply && user1 && user2 && user1.username == user2.username){
                            //Creating objects that will be sent in json file
                            let data = {
                                key:j._id,
                                username: (user1).username,
                                name: (user1).name,
                                email: (user1).email,
                                userImage: (user1).image,
                                tweetBody: j.body,
                                tweetMedia: j.media,
                                repliesCount: (j.replies).length, 
                                retweetersCount: (j.retweeters).length,
                                favoritersCount: (j.favoriters).length,
                                updatedAt: j.updatedAt,
                                createdAt: j.createdAt,
                                taggedUsers: j.taggedUsers
                            }
                            //pushing it to the array.
                            dataSent.push(data);
                        }
                    
                    }
                }
            }
        }

        if(dataSent.length>0){
            sortedArray = dataSent.sort(function(a, b){

                return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt) ;
            })
        }  
        //3ayzeen retweets terga3?
        return res.status(200).json({data: sortedArray, succes: "true"});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}

//Like/unlike Tweet
exports.likeTweet = async(req, res)=>{
    const userId =req.user.id;

    const tweetId = req.params.tweetId;

    try{
        //Find tweet by using id sent
        let tweetLiked = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
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
            return res.status(200).json({message: "removed like", tweet: tweetLiked});
        }

        //If not found then user is trying to like the tweet
         tweetLiked.favoriters.push(userId);
         console.log(tweetLiked.favoriters);
         //3ayza ashof el satr el gy da by3mel eh
         tweetLiked.user = userId;
        await tweetLiked.save();
        return res.status(200).json({message: "added like", tweet: tweetLiked});
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
    return res.status(200).json({message: "Retweeted successfully", tweets: tweets, users: users});
 }

 //function to make retweet
 exports.makeRetweet = async(req, res)=>{
    const {tweetId} = req.body;
    const userId =req.user.id;


    try{
    //Find the tweet by using the tweet id
        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        //If the post is deleted or not found
        if(!retweetedTweet){   
            return res.status(404).json({ error: 'Tweet not found' })
        }

        
        //Search if this user retweeted this tweet
        const isFoundUser = retweetedTweet.retweeters.indexOf(userId);


        //If it's the first time to retweet 
        if(isFoundUser === -1){
            retweetedTweet.retweeters.push(userId);
            console.log(retweetedTweet.retweeters);
            //retweetedTweet.user = userId;
            await retweetedTweet.save();
        }

        //Adding the retweet to the user
        let userRetweeted = await user.findById(userId);

        //User id is not found
        if(!userRetweeted){   
            return res.status(404).json({ error: 'User not found' })
        }

        //Adding the retweet to the user 
        userRetweeted.retweetedTweets.push(tweetId);
        console.log( userRetweeted.retweetedTweets);
        await userRetweeted.save();


        //Retweeted successfully
        return res.status(200).json({message: "Retweeted successfully", tweet: retweetedTweet, userRetweeted: userRetweeted});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

 } 

//Reply
 exports.makeReply = async(req, res) =>{
    const {body, tweetId, media, taggedUsers} = req.body;
    const userId =req.user.id;

    //Checking on the content of the comment
    if(!body&& !media && !taggedUsers){
        return res.status(422).json({error: "Please enter data to reply!"});
    }
    try{
        //Checking the length of media
        if(media&&media.length>4)
            return res.status(500).json({error:"The media must be less than 5"});
        
        //Checking the count of the tagged users
        if(taggedUsers && taggedUsers.length>10)
             return res.status(500).json({error:"Can't tag more than 10 users!"});

        //Reply is a tweet so we have to make the tweet first
        let createdTweet = new tweet({
        user: userId,
        isReply: true    
        });

        //Adding body if exists
        if(body)
            createdTweet.body = body;
        //Adding media/taggedUsers if exists
        if(taggedUsers)
            createdTweet.taggedUsers = taggedUsers;
        if(media)
            createdTweet.media=media;

        // save it in the datebase to find it by tweet id saved in replies
        await createdTweet.save();

        //Then we have to find the tweet the user is trying to reply on it
        let retweetedTweet = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        //If the post is deleted or not found
        if(!retweetedTweet){   
            return res.status(404).json({ error: 'Tweet not found' })
        }

        //Then we must add tweet created to the retweetedTweet's replies
        retweetedTweet.replies.push(createdTweet);
        await retweetedTweet.save();
        return res.status(200).json({message: "Replied successfully", tweet: retweetedTweet});

    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
 } 

//Get retweets of a tweet by tweetId
exports.getRetweets = async(req, res) =>{
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

//Get likers of a tweet by tweetId
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
                    image: user1.image
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

//Get taggged users of a tweet by tweetId
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

exports.getReplies = async(req, res) =>{
    const tweetId = req.params.tweetId;
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
                    let user1 = await user.findById(replyOfUser.user);
                    //Adding data that will be sent using json file
                    let data = {
                        username: user1.username,
                        name: user1.name,
                        email: user1.email,
                        image: user1.image,
                        replyBody: replyOfUser.body,
                        createdAt: replyOfUser.createdAt,
                        updatedAt: replyOfUser.updatedAt,
                        taggedUsers: replyOfUser.taggedUsers,
                        media: replyOfUser.media,
                        replies: replyOfUser.replies,
                        retweeters: replyOfUser.retweeters,
                        favoriters: replyOfUser.favoriters,
                        isReply: replyOfUser.isReply
                    }
                    //Pushing data to the array
                    dataUsers.push(data);
                }
            }
        }
        return res.status(200).json({message: "Success", users: dataUsers, count: replies.length}); 
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
    
}




