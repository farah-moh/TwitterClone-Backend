const sinon = require('sinon')
const supertest = require('supertest')
const httpMocks = require('node-mocks-http')
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const user = require('../models/user')
const homePage = require('../controllers/homePage')
const app = require('../app')
const assert = require('assert');
const tweet = require('../models/tweet')

jest.setTimeout(60000)

// Drop the whole users collection before testing and add a simple user to test with
//connecting to the testing database
const mongoDB = process.env.TEST_DATABASE
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })



describe('Retweet function', () => {
    let authToken = 'token'
    let id = 'testid'
    beforeEach(async () => {
        await mongoose.connection.collection('users').deleteMany({})

        // Creating the valid user to assign the token to him
        const validUser = new user({
            username: 'yomnaRetweet',
            name: 'yomnaRet',
            email: 'yomnaRet147@gmail.com',
            password: 'yomnaRet147',
            birthdate: '2001-9-12',
            country: 'Egypt',
            city: 'Cairo',
            confirmed: 'true',
            confirmEmailToken: '251234567893665'
        })
        await validUser.save();
        
        const validUser2 = new user({
            username: 'yomnaRetweet2',
            name: 'yomnaRet2',
            email: 'yomnaRet1472@gmail.com',
            password: 'yomnaRet1472',
            birthdate: '2001-9-12',
            country: 'Egypt',
            city: 'Cairo',
            confirmed: 'true',
            confirmEmailToken: '981234567898752'
        })
        await validUser2.save();
        
        const validTweet = new tweet({
                user: validUser._id, 
                body: "Hello!"
        })
        await validTweet.save();

        // get the id of the document in the db to use it to get authorization token
        await user.find({ email: 'yomnaRet147@gmail.com' }, (err, User) => {
            currUser = User;
            id = User._id;
            authToken = 'Bearer '+jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE})
            base = {'Authorization': JSON.stringify(authToken), 'Content-Type': 'application/json'};
        }).clone()

    })

    // Drop the whole users collection after finishing testing
    afterAll(async () => {
        await mongoose.connection.collection('users').deleteMany({})
        mongoose.disconnect();
    })

    // Get retweets successfully
    it('Get Retweets successfully', async () => {
       
        tweetUser = await tweet.find({user: (await user.find({username:"yomnaRetweet"}))});
        
         //Getting userRetweeters
        let dataUsers = []; 
        let usersRetweeters = tweetUser.retweeters;
    
        if(usersRetweeters)
            dataUsers = await homePage.getRetweetsFunc(usersRetweeters);
        let data =[];
       
        assert.deepStrictEqual(data.length, dataUsers.length);
    })
})
