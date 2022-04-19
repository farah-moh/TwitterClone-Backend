const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');

//Sign Up Services + Route Handlers


//   Creating Sign Token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
}

//   Creating new user
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


/*  ******* Sign Up + Confirmation ******* */

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
      newUser.confirmEmailTokenExpiry = undefined;
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


/*  ******* Login + Validation + Facebook Login ******* */

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


/*  ******* Forgot Password + Change Password ******* */

  //email is sent in body
exports.forgotPassword = catchAsync(async (req, res, next) => {
    await sendForgotPasswordToken(req.body.email);
  
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  });


const sendForgotPasswordToken = async email => {
    const User = await user.findOne(email);
    if (!User) {
      throw new AppError('Email not found.', 404);
    }
    const resetToken = await user.generatePasswordResetToken();
    const resetPasswordText = 
    `Click this link to reset your password\n
    http://localhost:${process.env.PORT}/password-reset/${emailConfirmationToken}\n`;

    try {
      await sendEmail({
        email: User.email,
        subject: 'Password Reset Token',
        message: resetPasswordText
      });
      res.status(200).json({
        status: 'success',
        message: 'Check your email for password reset.'
      });
    } catch (err) {
      newUser.passwordResetToken = undefined;
      newUser.passwordResetTokenExpiry = undefined;
      await newUser.save({
        validateBeforeSave: false
      });
      throw new AppError(
        `There was an error sending the email. ${err} `, 500
      );
    }
  };
  exports.sendForgotPasswordToken = sendForgotPasswordToken;

const resetPassword = async (token, password) => {
    const hashedToken = crypto
      .createHash('SHA256')
      .update(token)
      .digest('hex');
  
    const User = await user.findOne(
      {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: {$gt: Date.now()}
      }
    );
  
    if (!user) throw new AppError(`Token is invalid or has expired`, 400);
  
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();
  
    return user;
  };
exports.resetPassword = resetPassword;

const changePassword = async (id, password, newPassword) => {
  const User = await user.findOne({_id: id});

  if (!User) throw new AppError('Invalid User', 400);

  if (!(await user.validatePassword(password, user.password)))
    throw new AppError('Incorrect password', 401);

  User.password = newPassword;
  await User.save();
  return User;
};
exports.changePassword = changePassword;