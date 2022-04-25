const authentication = require('../controllers/authentication')
const supertest = require('supertest')
const mongoose = require('mongoose')
const httpMocks = require('node-mocks-http')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const user = require('../models/user')
dotenv.config({ path: '.env' })
const app = require('../app')
// const sendEmail = require('./../utils/email_info')
// const crypto = require('crypto');
// const { ObjectId } = require('mongoose').Types;
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const { promisify } = require('util');


//connecting to the testing database
const mongoDB = process.env.TEST_DATABASE
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })


describe('Signup function',()=>{
    let authToken = 'token'
    let id = 'testid'

    // Droping the whole users and starting with an empty DB
    beforeEach(async () => {
        await mongoose.connection.collection('users').deleteMany({})
    
        // Creating the valid user to assign the token to him
        const validUser = new user({
          username: 'hehe',
          name: 'blabla',
          email: 'lol@gmail.com',
          password: 'lol12345',
          birthdate: '2001-9-12',
          country: 'Egypt',
          city: 'Cairo',
          confirmed: 'false'
         })
         await validUser.save();
  
        // get the id of the document in the db to use it to get authorization token
        await user.findOne({ email: 'lol@gmail.com' }, (err, User) => {
          id = User._id
          authToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
        }).clone()
      })
    
    // Drop the whole users collection after finishing testing
    afterAll(async () => {
        await mongoose.connection.collection('users').deleteMany({})
    })

    // Testing sign up successfully
  it('Sign up should be successful', async () => {
    const response = await supertest(app).post('/signup').send({
        username: 'Zeft',
        name: 'nela',
        email: 'irushbull@gmail.com',
        password: 'boody123',
        birthdate: '2001-9-12',
        country: 'Egypt',
        city: 'Cairo'
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.message).toBe('Check your email for confirmation.')
  })

  //Trying errors in sign up
  it('Should not sign up because email is not sent', done => {
    const request = httpMocks.createRequest({
      method: 'POST',
      url: '/signUp',
      body: {
        username: 'Zeft',
        name: 'nela',
        password: 'boody123',
        birthdate: '2001-9-12',
        country: 'Egypt',
        city: 'Cairo'
      }
    })

    const response = httpMocks.createResponse()
    authentication.signUp(request, response, (err) => {
      try {
        expect(err).toEqual(expect.anything())
        expect(err.name).toEqual('ValidationError')
        done()
      } catch (error) {
        done(error)
      }
    })
  })

  //Trying errors in sign up
  it('Should not sign up because email is not valid', done => {
    const request = httpMocks.createRequest({
      method: 'POST',
      url: '/signUp',
      body: {
        username: 'Zeft',
        name: 'nela',
        email: 'irushbullegmail.com',
        password: 'boody123',
        birthdate: '2001-9-12',
        country: 'Egypt',
        city: 'Cairo'
      }
    })

    const response = httpMocks.createResponse()
    authentication.signUp(request, response, (err) => {
      try {
        expect(err).toEqual(expect.anything())
        expect(err.name).toEqual('ValidationError')
        done()
      } catch (error) {
        done(error)
      }
    })
  })

    //Trying errors in sign up
    it('Should not sign up because there is no username', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/signUp',
          body: {
            name: 'nela',
            email: 'irushbulle@gmail.com',
            password: 'boody123',
            birthdate: '2001-9-12',
            country: 'Egypt',
            city: 'Cairo'
          }
        })
    
        const response = httpMocks.createResponse()
        authentication.signUp(request, response, (err) => {
          try {
            expect(err).toEqual(expect.anything())
            expect(err.name).toEqual('ValidationError')
            done()
          } catch (error) {
            done(error)
          }
        })
      })

    //Trying errors in sign up
    it('Should not sign up because there is no password', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/signUp',
          body: {
            username: 'Zeft',
            name: 'nela',
            email: 'irushbulle@gmail.com',
            birthdate: '2001-9-12',
            country: 'Egypt',
            city: 'Cairo'
          }
        })
    
        const response = httpMocks.createResponse()
        authentication.signUp(request, response, (err) => {
          try {
            expect(err).toEqual(expect.anything())
            expect(err.name).toEqual('Error')
            done()
          } catch (error) {
            done(error)
          }
        })
      })

        //Trying errors in sign up
  it('Should not sign up because the password is less than the required length', done => {
    const request = httpMocks.createRequest({
      method: 'POST',
      url: '/signUp',
      body: {
        username: 'Zeft',
        name: 'nela',
        email: 'irushbulle@gmail.com',
        password: 'bo123',
        birthdate: '2001-9-12',
        country: 'Egypt',
        city: 'Cairo'
      }
    })

    const response = httpMocks.createResponse()
    authentication.signUp(request, response, (err) => {
      try {
        expect(err).toEqual(expect.anything())
        expect(err.name).toEqual('ValidationError')
        done()
      } catch (error) {
        done(error)
      }
    })
  })


          //Trying errors in sign up
    it('Should not sign up because there is no birthdate', done => {
      const request = httpMocks.createRequest({
        method: 'POST',
        url: '/signUp',
        body: {
          username: 'Zeft',
          name: 'nela',
          email: 'irushbulle@gmail.com',
          password: 'boody123',
          country: 'Egypt',
          city: 'Cairo'
        }
      })

      const response = httpMocks.createResponse()
      authentication.signUp(request, response, (err) => {
        try {
          expect(err).toEqual(expect.anything())
          expect(err.name).toEqual('ValidationError')
          done()
        } catch (error) {
          done(error)
        }
      })
    })

    it('Should not sign up because user is less than 13 years old', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/signUp',
          body: {
            username: 'Zeft',
            name: 'nela',
            email: 'irushbulle@gmail.com',
            birthdate: '2020-9-12',
            password: 'boody123',
            country: 'Egypt',
            city: 'Cairo'
          }
        })
  
        const response = httpMocks.createResponse()
        authentication.signUp(request, response, (err) => {
          try {
            expect(err).toEqual(expect.anything())
            expect(err.name).toEqual('ValidationError')
            done()
          } catch (error) {
            done(error)
          }
        })
      })

      it('Should not sign up because user has no name', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/signUp',
          body: {
            username: 'Zeft',
            email: 'irushbulle@gmail.com',
            birthdate: '2020-9-12',
            password: 'boody123',
            country: 'Egypt',
            city: 'Cairo'
          }
        })
  
        const response = httpMocks.createResponse()
        authentication.signUp(request, response, (err) => {
          try {
            expect(err).toEqual(expect.anything())
            expect(err.name).toEqual('ValidationError')
            done()
          } catch (error) {
            done(error)
          }
        })
      })

      it('Should not sign up because email is already taken', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/signUp',
          body: {
            username: 'Zeft',
            email: 'lol@gmail.com',
            birthdate: '2001-9-12',
            password: 'boody123',
            country: 'Egypt',
            city: 'Cairo'
          }
        })
  
        const response = httpMocks.createResponse()
        authentication.signUp(request, response, (err) => {
          try {
            expect(err).toEqual(expect.anything())
            expect(err.name).toEqual('ValidationError')
            done()
          } catch (error) {
            done(error)
          }
        })
      })

      it('Should not sign up because username is already taken', done => {
        const request = httpMocks.createRequest({
          method: 'POST',
          url: '/signUp',
          body: {
            username: 'hehe',
            email: 'irushbulle@gmail.com',
            birthdate: '2001-9-12',
            password: 'boody123',
            country: 'Egypt',
            city: 'Cairo'
          }
        })
  
        const response = httpMocks.createResponse()
        authentication.signUp(request, response, (err) => {
          try {
            expect(err).toEqual(expect.anything())
            expect(err.name).toEqual('ValidationError')
            done()
          } catch (error) {
            done(error)
          }
        })
      })

})