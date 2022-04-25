const mongoose = require('mongoose');
const dotenv = require('dotenv') 
dotenv.config({ path: '.env' }) 
const {faker} = require('@faker-js/faker');
require('dotenv').config();
const userSeed = require('./data/users');
const tweetSeed = require('./data/tweets');

const user = require('./../models/user');
const tweet = require('./../models/tweet');
const { ObjectId } = require('mongoose').Types;

const connectDB = require('./../utils/connectDB');

(async function() {
    //process.env.NODE_ENV = 'seed';
    process.on('uncaughtException', err => {
        console.log('UNCAUGHT EXCEPTION! Shutting down...')
        console.log(err.name, err.message)
        process.exit(1)
      })
      
      //Database connection
      mongoose.connect(process.env.DATABASE_LOCAL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }).then(con => {
        // console.log(con.connections);
        console.log('DB is connected successfuly!')
      })
    console.log('Running seeds, please wait...');
  
    const userObjects = userSeed();
    const users = await user.create(userObjects);
    const usersIds = users.map(el => el._id);
  
    const tweetObjects = tweetSeed(usersIds);
    const tweets = await tweet.create(tweetObjects);
    const tweetIds = tweets.map(el => el._id);

    for (let i = 0; i < tweetIds.length; i += 1) {
        let currUser = await tweet.findOne({'_id': tweetIds[i]}).select('user');
        currUser = currUser.user._id.toString();
        let currTweets = await user.findById(currUser);
        let User = await user.findById(currUser);
        console.log(currTweets);
        currTweets = currTweets.tweets;
        console.log(currTweets);
        currTweets.push(new ObjectId(tweetIds[i]));
        console.log(currTweets);
        User["tweets"] = currTweets;
        await User.save();
    }
    console.log('✅ Seeds executed successfully');
  })();