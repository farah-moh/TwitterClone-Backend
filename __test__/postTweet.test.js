const homePage = require('../controllers/homePage')
const supertest = require('supertest')
const mongoose = require('mongoose')
const httpMocks = require('node-mocks-http')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const user = require('../models/user')
const tweet = require('../models/tweet')
dotenv.config({ path: '.env' })
const app = require('../app')

//connecting to the testing database
const mongoDB = process.env.TEST_DATABASE
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })

describe('postTweet function', () => {
    

    // Droping the whole users and starting with an empty DB
    beforeEach(async () => {
      await mongoose.connection.collection('users').deleteMany({})
  
      // Creating the valid user to assign the token to him
      const validUser = new user({
        username: 'Boody',
        name: 'Abdelrahman',
        email: 'rahmanezzat14@gmail.com',
        password: 'boody123',
        birthdate: '2001-9-12',
        country: 'Egypt',
        city: 'Cairo',
        confirmed: 'true',
        confirmEmailToken: 'true'
       })
       await validUser.save();

       const validUser2 = new user({
        username: 'yosamah',
        name: 'yomna',
        email: 'yomnaosamma@gmail.com',
        password: 'yomna123',
        birthdate: '2001-03-01',
        country: 'Egypt',
        city: 'Cairo',
        confirmed: 'true',
        following : [validUser._id],
        confirmEmailToken: 'true'
       })
       await validUser2.save();


       const validUser3 = new user({
        username: 'mosamah',
        name: 'mohamed',
        email: 'mohamedosamma@gmail.com',
        password: 'mohamed123',
        birthdate: '1997-01-01',
        country: 'Egypt',
        city: 'Cairo',
        confirmed: 'true',
        following : [validUser1._id, validUser2.id],
        confirmEmailToken: 'true'
       })
       await validUser3.save();


       const validTweet = new tweet({
            user: validUser,
            body: "helloo i am the 1st user"

       })
       await validTweet.save();

       afterAll(async () => {
        await mongoose.connection.collection('users').deleteMany({})
      })
  
      let id = validTweet._id;
      it('like should be successful', async () => {
        const response = await supertest(app).post('/home/compose-tweet').send({
            body: "helloo! this is our first tweet",
            userId: validUser2._id
        })
        expect(response.status).toBe(200)
        //expect(response.body.success).toBe(true)
        //expect(response.body.token).toBe(authToken)
      })

      it('Will not like', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/home/compose-tweet',
          body: {
            body: "helloo! this is our first tweet",
            userId: "624c4284e42ed8fe5b098d2cnnddwa"
          }
        })
    

      // get the id of the document in the db to use it to get authorization token
    })
  
    // Drop the whole users collection after finishing testing  
    })
})