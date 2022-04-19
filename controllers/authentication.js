const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');

//Sign Up Services + Route Handlers

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
}

const createUser = async body => {
    const newUser = await user.create({
        username: body.username,
        name: body.name,
        email: body.email,
        password: body.password,
        birthdate: body.birthdate,
        country: body.country,
        city: body.city,
      });
      return newUser;
}
exports.createUser = createUser;

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await createUser(req.body); 

    const emailConfirmationToken = await newUser.generateEmailConfirmToken();

    const confirmEmailText = 
    `Click this link to confirm your email\n
    http://localhost:${process.env.PORT}/signup-confirm/${emailConfirmationToken}\n`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: `Account Confirmation Token ${confirmEmailText}`,
        message: confirmEmailText
      });
      res.status(200).json({
        status: 'success',
        message: 'Check your email for confirmation.'
      });
    } catch (err) {
      newUser.confirmEmailToken = undefined;
      newUser.passwordResetTokenExpiry = undefined;
      await newUser.save({
        validateBeforeSave: false
      });
      throw new AppError(
        `There was an error sending the confirmation email. Try again. ${err} `,
        500
      );
    }

    await newUser.save();

    
});

exports.signUpConfirmed = catchAsync(async (req, res, next) => {
    if (!req.params.token)
    return next(new AppError('No email confirmation token found.'));

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');


    const currUser = await user.findOne({confirmEmailToken: hashedToken} );
    if (!currUser) return next(new AppError(`Token is invalid or has expired`, 400));

    currUser.confirmEmailToken = undefined;
    currUser.confirmed = true;
    await currUser.save();
    
    const token = signToken(currUser._id);

    res.status(200).json({
        status: 'Success',
        success: true,
        expireDate: process.env.JWT_EXPIRE,
        token,
        // data: {
        //   currUser
        // }
      })
  
})


/* ------------------------------------------------------------------------- */


const validateLogin = async (email, password) => {
    const User = await user.findOne({email: email});
    if (!User) throw new AppError('Incorrect email or password', 400);
    const correct = await User.validatePassword(password, User.password);
  
    //INCORRECT PASSWORD
    if (!correct) {
      throw new AppError('Incorrect email or password', 400);
    }
    
    return User;
};

exports.login = catchAsync(async (req, res, next) => {
  
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError('Email or password can not be empty', 400));
  
    //Check if the given email and password exist in the databse.
    const User = await validateLogin(email, password);

    //EMAIL NOT CONFIRMED
    if (!User.confirmed) return next(new AppError('Please confirm your email.',400)); // understand

    ////Send the new User in the response.
    const token = signToken(User._id);

    res.status(200).json({
    status: 'Success',
    success: true,
    expireDate: process.env.JWT_EXPIRE,
    token
    })
  });

  exports.loginWithFacebook = catchAsync(async (req, res, next) => {
    const token = signToken(req.user_id);

    res.status(200).json({
      status: 'Success',
      success: true,
      expireDate: process.env.JWT_EXPIRE,
      token
      })
  })