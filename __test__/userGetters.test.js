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
    await mongoose.connection.collection('users').deleteMany({})
  })


  let session = null;
  it('Should login', done => {
    supertest(app)  
      .post('/login')  
      .send({
            email: 'boody123@gmail.com',
            password: 'boody123'
          })  
      .end((err, res) => {  
         if (err) {
           return done(err);
         }
         session = res.token;  
         done();  
     });
  })

  //Testing update profile successfully
  it('Should get edit profile successfully', async () => {
    const response = await supertest(app).get('/settings/profile').set(base).send({

    })
    console.log(JSON.stringify(authToken))
    expect(response.status).toBe(200)
    // expect(response.body.status).toBe('Success')
    // expect(response.body.user.name).toBe('mohamed')
    // expect(response.body.user.email).toBe('mohamed@email.com')
    // expect(response.body.user.gender).toBe('male')
    // expect(response.body.user.dateOfBirth).toBe('1990-4-10')
  })

})