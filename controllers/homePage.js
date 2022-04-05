const express = require('express'); 
const user = require('../models/user');
const tweet = require('../models/tweet');


const retreiveTweet = async user=>{
    const tweetsUser = await tweet.find({});
    const UserTweets = tweetsUser.filter(tweetsUser=>{
        return tweetsUser.user == user._id;
    })
    return UserTweets;
}

exports.postTweet = async(req, res)=>{
    const {body, media, userId} = req.body;

    //returns user with given ID
    //const userTweet= await user.find({});
    // const userMe = userTweet.filter(userTweet=>{
    //          return userTweet._id ===  req.userId;
    // })
    if(!body&& !media){
        return res.status(422).json({error: "Please enter data to post the tweet!"});
    }
    
    try{
        let createTweet = new tweet({
            //media,
            body: body,
            user: userId
            
        });
        if (media)
            createTweet.media = media;
        await createTweet.save();
        return res.status(200).json({succes: "true", tweet: createTweet})
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}

exports.getTweets = async(req, res)=>{
    const {userId} =req.body;

    try{
        const userTweet= await user.find({});
        const userMe = userTweet.filter(userTweet=>{
            return userTweet._id == userId;
        })
        let myTweets = await retreiveTweet(userMe);
        console.log(myTweets)
        const userFollowings = userMe[0].following;

       for(let i of userFollowings){
           const newTweets =await retreiveTweet(i);
           console.log(i)
           console.log("NEWTWSSSEETS")
           console.log(newTweets)
            myTweets = myTweets+newTweets;
        }

       // console.log(myTweets)
        //tweet.find().sort({ createdAt: -1 }).populate('user');
        //const totalCount = await tweet.estimatedDocumentCount().exec()


        return res.status(200).json({data: myTweets, /*userMee: userFollowings,*/succes: "true"});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }

}


exports.likeTweet = async(req, res)=>{
    const {userId} =req.body;
    const tweetId = req.params.tweetId;

    try{
       // const likedTweet= await tweet.find({});
        // const tweetLiked = likedTweet.filter(likedTweet=>{
        //    return likedTweet._id == tweetId;
        //  })
        let tweetLiked = await tweet.findById(tweetId).populate('user').populate({ path: 'body.with', select: '_id name' });
        
        if(!tweetLiked){
            
            return res.status(404).json({ error: 'tweet not found' })
        }
        
        // console.log(favourites);
        // let found ="false";
        // for(let fav of favourites){
        //     if(fav == userId){
        //         found = "true"
        //     }
        // }
       // console.log(tweetLiked)
        //let favoriters = tweetLiked.favoriters;
        //console.log(favoriters)
        const index = tweetLiked.favoriters.indexOf(userId)
    
        if(index !== -1){
            tweetLiked.favoriters.splice(index, 1);
            await tweetLiked.save();
            return res.status(200).json({message: "removed like", tweet: tweetLiked});
        }
        
         tweetLiked.favoriters.push(userId);
         console.log(tweetLiked.favoriters);
         tweetLiked.user = userId;
        await tweetLiked.save();
        return res.status(200).json({message: "added like", tweet: tweetLiked});
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
};


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




