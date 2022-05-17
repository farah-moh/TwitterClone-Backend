const authentication = require('../controllers/authentication')
const settingsController = require('../controllers/settings')
const supertest = require('supertest')
const mongoose = require('mongoose')
const httpMocks = require('node-mocks-http')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const user = require('../models/user')
dotenv.config({ path: '.env' })
const app = require('../app')
const assert = require('assert')

//connecting to the testing database
const mongoDB = process.env.TEST_DATABASE
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })


describe('Login function', () => {
    let authToken = 'token'
    let id = 'testid'

    // Droping the whole users and starting with an empty DB
    beforeEach(async () => {
      await mongoose.connection.collection('users').deleteMany({})
  
      // Creating the valid user to assign the token to him
      const validUser = new user({
        username: 'Mohamedzzzzzz',
        name: 'Mohamed',
        email: 'mohamedmostafa1632001@gmail.com',
        password: 'moha123456',
        birthdate: '2001-3-16',
        country: 'Egypt',
        city: 'Cairo',
        confirmed: 'true',
        confirmEmailToken: 'true'
       })
       await validUser.save();

      // get the id of the document in the db to use it to get authorization token
      await user.findOne({ email: 'mohamedmostafa1632001@gmail.com' }, (err, User) => {
        id = User._id
        authToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
      }).clone()
    })

    
  
    // Drop the whole users collection after finishing testing
    afterAll(async () => {
      await mongoose.connection.collection('users').deleteMany({})
      mongoose.disconnect();
    })

    it('Finding by Username should by successful', async () => {
    let User1 = await user.findOne({username: 'Mohamedzzzzzz'});
    const User2 = await settingsController.changeUsername(User1._id,'nanoo');
    assert.deepStrictEqual(User1.name, User2.name);
    })

    it('Finding by Id should by successful', async () => {
    let User1 = await user.findOne({username: 'Mohamedzzzzzz'});
    const User2 = await settingsController.userById(User1._id);
    assert.deepStrictEqual(User1.name, User2.name);
    })

    it('Finding by Email should by successful', async () => {
    let User1 = await user.findOne({username: 'Mohamedzzzzzz'});
    const User2 = await settingsController.userByEmail(User1.email);
    assert.deepStrictEqual(User1.name, User2.name);
    })
    

})