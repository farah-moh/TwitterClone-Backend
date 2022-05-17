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
            username: 'yomnaReply',
            name: 'yomnaRep',
            email: 'yomnaRep147@gmail.com',
            password: 'yomnaRep147',
            birthdate: '2001-9-12',
            country: 'Egypt',
            city: 'Cairo',
            confirmed: 'true',
            confirmEmailToken: '1234567893665'
        })
        await validUser.save();
        
        const validUser2 = new user({
            username: 'yomnaReplyy2',
            name: 'yomnaRep2',
            email: 'yomnaRep1472@gmail.com',
            password: 'yomnaRep1472',
            birthdate: '2001-9-12',
            country: 'Egypt',
            city: 'Cairo',
            confirmed: 'true',
            confirmEmailToken: '1234567898752'
        })
        await validUser2.save();
        
        const validTweet = new tweet({
                user: validUser._id, 
                body: "Hello!"
        })
        await validTweet.save();

        // get the id of the document in the db to use it to get authorization token
        await user.find({ email: 'yomnaRep147@gmail.com' }, (err, User) => {
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

    // Reply successfully
    it('Reply should be successful', async () => {
        let lolUser = await user.findOne({username: 'yomnaReply'});
        let user2 = await user.findOne({username: 'yomnaReplyy2'})
        tweetUser = await tweet.findOne();
        const body = "HELLO";
        const media = ['url1'];
        const taggedUsers = [`${user2._id}`];
        const tweetReply = await homePage.makeReplyFunc(lolUser._id, body, tweetUser._id, media, taggedUsers)
        assert.deepStrictEqual(tweetUser._id, tweetReply._id);
    })
})
