const sinon = require('sinon')
const supertest = require('supertest')
const httpMocks = require('node-mocks-http')
const dotenv = require('dotenv')
dotenv.config({ path: '.env' })
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const user = require('../models/user')
const authentication = require('../controllers/authentication')
const userController = require('../controllers/userController')
const app = require('../app')
const assert = require('assert');

jest.setTimeout(60000)

// Connecting to the database
const mongoDB = process.env.TEST_DATABASE
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })

// Testing userService get user id
describe('userService get user id functionality', () => {
  let authToken = 'token'
  let id = 'testid'
  let currUser = null;
  var base = null;
  
  // Drop the whole users collection before testing and add a simple user to test with
  beforeEach(async () => {
    await mongoose.connection.collection('users').deleteMany({})

    // Creating the valid user to assign the token to him
    const validUser = new user({
        username: 'bodda',
        name: 'Abdelrahman',
        email: 'boody123@gmail.com',
        password: 'boody123',
        birthdate: '2001-9-12',
        country: 'Egypt',
        city: 'Cairo',
        confirmed: 'true',
        confirmEmailToken: '123456789'
       })
       await validUser.save();
       

      // get the id of the document in the db to use it to get authorization token
      await user.find({ email: 'boody123@gmail.com' }, (err, User) => {
        currUser = User;
        id = User._id;
        authToken = 'Bearer '+jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE})
        base = {'Authorization': JSON.stringify(authToken), 'Content-Type': 'application/json'};
      }).clone()
  })

  // Drop the whole users collection after finishing testing
  afterAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    mongoose.disconnect();
  })

  //Testing update edit profile successfully
  it('Should patch edit profile successfully', async () => {
    let lolUser = await user.findOne({username: 'bodda'});

    const newInfo = {
        name: "booodaaa",
        bio: "hello world",
        country: "Egypt",
        city: "Cairo",
        website: "www.bodda.com",
        birthdate: "2002-12-04"
    }
    lolUser = await userController.editProfileFunc(lolUser._id,newInfo)

    assert.deepStrictEqual(lolUser.name, 'booodaaa');
  })

  //Testing get edit profile successfully
  it('Should get edit profile successfully', async () => {
    let lolUser = await user.findOne({username: 'bodda'});
    const xDUser = await userController.getEditProfileFunc(lolUser._id)
    assert.deepStrictEqual(lolUser.name, xDUser.name);
  })

    //Testing get profile successfully
    it('Should get profile successfully', async () => {
      let lolUser = await user.findOne({username: 'bodda'});
      const xDUser = await userController.preGetProfile(lolUser.username,lolUser._id,'profile')
      assert.deepStrictEqual(lolUser.name, xDUser.name);
    })

    //Testing get profile media successfully
    it('Should get profile media successfully', async () => {
      let lolUser = await user.findOne({username: 'bodda'});
      const xDUser = await userController.preGetProfile(lolUser.username,lolUser._id,'media')
      assert.deepStrictEqual(lolUser.name, xDUser.name);
    })

    //Testing get profile likes successfully
    it('Should get profile likes successfully', async () => {
      let lolUser = await user.findOne({username: 'bodda'});
      const xDUser = await userController.preGetProfile(lolUser.username,lolUser._id,'likes')
      assert.deepStrictEqual(lolUser.name, xDUser.name);
    })
    


})