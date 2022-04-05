const authentication = require('../controllers/authentication')
const supertest = require('supertest')
const mongoose = require('mongoose')
const httpMocks = require('node-mocks-http')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const user = require('../models/user')
dotenv.config({ path: '.env' })
const app = require('../app')

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

      // get the id of the document in the db to use it to get authorization token
      await user.findOne({ email: 'rahmanezzat14@gmail.com' }, (err, User) => {
        id = User._id
        authToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
      }).clone()
    })
  
    // Drop the whole users collection after finishing testing
    afterAll(async () => {
      await mongoose.connection.collection('users').deleteMany({})
    })
  
    // Testing sign in successfully
    it('login should be successful', async () => {
      const response = await supertest(app).post('/login').send({
        email: 'rahmanezzat14@gmail.com',
        password: 'boody123'
      })
      expect(response.status).toBe(200)
      expect(response.body.status).toBe('Success')
      expect(response.body.success).toBe(true)
      //expect(response.body.token).toBe(authToken)
    })

    // Testing login without confirm
    it('login will not be successful due to unconfirmed email', async () => {

      await user.findOneAndUpdate({}, {confirmed: false});

      const response = await supertest(app).post('/login').send({
        email: 'rahmanezzat14@gmail.com',
        password: 'boody123'
      })
      expect(response.status).toBe(400)

      await user.findOneAndUpdate({}, {confirmed: true});
    })

    //Entering a wrong email to test with
    it('Will not login due to incorrect email', done => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/login',
        body: {
          email: 'rahmanezzat@gmail.com',
          password: 'boody123'
        }
      })
  
      const response = httpMocks.createResponse()
      authentication.login(request, response, (err) => {
        try {
          expect(err).toEqual(expect.anything())
          expect(err.statusCode).toEqual(400)
          expect(err.status).toEqual('fail')
          done()
        } catch (error) {
          done(error)
        }
      })
    })

    //Entering a wrong password to test with
    it('Will not login due to incorrect password', done => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/login',
        body: {
          email: 'rahmanezzat14@gmail.com',
          password: 'boody'
        }
      })
  
      const response = httpMocks.createResponse()
      authentication.login(request, response, (err) => {
        try {
          expect(err).toEqual(expect.anything())
          expect(err.statusCode).toEqual(400)
          expect(err.status).toEqual('fail')
          done()
        } catch (error) {
          done(error)
        }
      })
    })

    //Entering no password to test with
    it('Will not login due to absence of password', done => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/login',
        body: {
          email: 'rahmanezzat14@gmail.com',
        }
      })
  
      const response = httpMocks.createResponse()
      authentication.login(request, response, (err) => {
        try {
          expect(err).toEqual(expect.anything())
          expect(err.statusCode).toEqual(400)
          expect(err.status).toEqual('fail')
          done()
        } catch (error) {
          done(error)
        }
      })
    })

    //Entering no email to test with
    it('Will not login due to absence of email', done => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/login',
        body: {
          password: 'boody123',
        }
      })
  
      const response = httpMocks.createResponse()
      authentication.login(request, response, (err) => {
        try {
          expect(err).toEqual(expect.anything())
          expect(err.statusCode).toEqual(400)
          expect(err.status).toEqual('fail')
          done()
        } catch (error) {
          done(error)
        }
      })
    })

})