const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');

//Sign Up Services + Route Handlers

exports.createUser = async body => {
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

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await createUser(req.body); 

    const emailConfirmationToken = await newUser.generateEmailConfirmToken();
    const confirmEmailText = 
    `Click this link to confirm your email\n
    http://localhost:${process.env.PORT}/confirm-email/${emailConfirmationToken}\n`

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Account Confirmation Token',
        confirmEmailText
      });
      res.status(200).json({
        status: 'success',
        message: 'Check your email for confirmation.'
      });
    } catch (err) {
      newUser.confirmEmailToken = undefined;
      newUser.passwordResetTokenExpiry = undefined;
      await newUser.save({
        //validateBeforeSave: false
      });
      throw new AppError(
        `There was an error sending the confirmation email. Try again.`,
        500
      );
    }

    await newUser.save();

    
});

exports.signUpConfirmed = catchAsync(async (req, res, next) => {
    if (!req.params.token)
    return next(new AppError('No email confirmation token found.'));

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const newUser = await user.findOne({emailConfirmationToken: hashedToken} );
    if (!newUser) return next(new AppError(`Token is invalid or has expired`, 400));

    newUser.confirmEmailToken = undefined;
    newUser.confirmed = true;
    await newUser.save();

    const token = jwt.sign(newUser._id, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE_IN });

    res.status(200).json({
        status: 'Success',
        success: true,
        expireDate: process.env.JWT_EXPIRE_IN,
        token,
        // data: {
        //   newUser
        // }
      })
  
})


/* ------------------------------------------------------------------------- */


exports.validateLogin = async (email, password) => {
    const user = await User.findOne({email: email});
    if (!user) throw new AppError('Incorrect email or password', 400);
    const correct = await User.validatePassword(password, user.password);
  
    //INCORRECT PASSWORD
    if (!correct) {
      throw new AppError('Incorrect email or password', 400);
    }
    
    return user;
};

exports.login = catchAsync(async (req, res, next) => {
  
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError('Email or password can not be empty', 400));
  
    //Check if the given email and password exist in the databse.
    const user = await validateLogin(email, password);

    //EMAIL NOT CONFIRMED
    if (!user.confirmed) return next(new AppError('Please confirm your email.',400)); // understand

    //Send the new User in the response.
    const token = jwt.sign(user._id, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE_IN });

    res.status(200).json({
    status: 'Success',
    success: true,
    expireDate: process.env.JWT_EXPIRE_IN,
    token
    })
  });