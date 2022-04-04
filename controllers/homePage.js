const express = require('express'); 
const user = require('../models/user');
const tweets = require('../models/tweet');
const tweet = require('../models/tweet');


exports.postTweet = async(req, res)=>{
    const {body, media} = req.body;
    if(!body && body.trim().length === 0 && !media){
        return res.status(422).json({error: "Please enter data to post the tweet!"});
    }
    
    try{
        let createTweet = new tweet({
            media,
            body, 
            user: req.userId
            
        });
        const saveTweet = await createTweet.save();
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({error:"Something went wrong"})
    }
    

}

