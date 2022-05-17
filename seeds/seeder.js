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
const MimeNode = require('nodemailer/lib/mime-node');

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
        currTweets = currTweets.tweets;
        currTweets.push(new ObjectId(tweetIds[i]));
        User["tweets"] = currTweets;
        await User.save();
    }

    let user1 = await user.findById(usersIds[0]);
    let to_follow = [];
    for(let i=1;i<10;i+=1) {
      let currUser = await user.findById(usersIds[i]);
      let followers = currUser.followers;
      followers.push(new ObjectId(usersIds[0]));
      currUser["followers"] = followers;
      await currUser.save();
      to_follow.push(new ObjectId(usersIds[i]));
    }

    user1["following"] = to_follow;
    user1.save();

    createUser();

    console.log('✅ Seeds executed successfully');
  })();

// Initializing known users
createUser = async ()=>{

    const user1 = new user({
        email: 'rahmanezzat14@gmail.com',
        confirmed: true,
        username: 'boody',
        password: 'boody123',
        birthdate: "2001-07-16",
        name: 'Abdelrahman',
        city: 'Cairo',
        country: 'Egypt',
        protectedTweets: false
    })
    await user1.save();

    const user2 = new user({
        email: 'farahabdelfatttah@gmail.com',
        confirmed: true,
        username: 'faroohaa',
        password: 'farah123',
        birthdate: "2001-09-12",
        name: 'Farah',
        city: 'Cairo',
        country: 'Egypt',
        protectedTweets: false,
    })
    await user2.save();

    const user3 = new user({
        email: 'ossamamostafa5@gmail.com',
        confirmed: true,
        username: 'osama',
        password: 'osama123',
        birthdate: "2001-09-12",
        name: 'Mostafa',
        city: 'Cairo',
        country: 'Egypt',   
        protectedTweets: false,
    })
    await user3.save();
}