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
exports.signToken = signToken;

/**
 * @description Makes an instance of a new user
 * @param {object} body - Containes the sign up info of the user
 * @returns {Object} user object
 */
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
    http://34.236.108.123:3000/signup-confirm/${emailConfirmationToken}\n`;

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
/**
 * @description - Validates the email and password and check if they are correct
 * @param {string} email - The user email 
 * @param {string} password - The user password
 * @returns {Object} userObject
 */
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
    const token = signToken(req.user._id);

    res.status(200).json({
      status: 'Success',
      success: true,
      expireDate: process.env.JWT_EXPIRE,
      token
      })
    // res.redirect(process.env.FRONTEND_URL)
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


/**
 * @description - Sends a mail to a user for forget password
 * @param {String} email - The email of the user to send the token to
 * @param {String} baseURL - The URL of for the password reset that is sent by email
 */
const sendForgotPasswordToken = async email => {
    const User = await user.findOne({email});
    if (!User) {
      throw new AppError('Email not found.', 404);
    }
    const resetToken = await User.generatePasswordResetToken();
    const resetPasswordText = 
    `Click this link to reset your password\n
    http://localhost:${process.env.PORT}/reset-password/${resetToken}\n`;

    try {
      await sendEmail({
        email: User.email,
        subject: 'Password Reset Token',
        message: resetPasswordText
      });

    } catch (err) {
      User.passwordResetToken = undefined;
      User.passwordResetTokenExpiry = undefined;
      await User.save({
        validateBeforeSave: false
      });
      throw new AppError(
        `There was an error sending the email. ${err} `, 500
      );
    }
  };
  exports.sendForgotPasswordToken = sendForgotPasswordToken;

  /**
   * @description - Resets the user password
   * @param {string} token - The token sent with the request
   * @param {string} password - The new password to update the database
   * @returns {Object} userObject 
   */
const resetPasswordFunc = async (token, password) => {
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
  
    if (!User) throw new AppError(`Token is invalid or has expired`, 400);
  
    User.password = password;
    User.passwordResetToken = undefined;
    User.passwordResetTokenExpiry = undefined;
    await User.save();
  
    return User;
  };
exports.resetPasswordFunc = resetPasswordFunc;

exports.resetPassword = catchAsync(async (req, res, next) => {
  if (!req.body.password)
    return next(
      new AppError(
        'Please send password in the request body.', 400
      )
    );

  const User = await resetPasswordFunc(
    req.params.token,
    req.body.password
  );

  await User.save();
  res.status(200).json({
    status: 'Success'
  })
});

/**
 * @description - Checks the user password and changes it to the new password
 * @param {string} id - The user ID
 * @param {string} password - The user's old password
 * @param {string} newPassword - The user's new password
 * @returns {Object} userObject
 */
const changePasswordFunc = async (id, password, newPassword) => {
  const User = await user.findOne({_id: id});

  if (!User) throw new AppError('Invalid User', 400);

  if (!(await User.validatePassword(password, User.password)))
    throw new AppError('Incorrect password', 401);

  User.password = newPassword;
  return User;
};
exports.changePasswordFunc = changePasswordFunc;

exports.changePassword = catchAsync(async (req, res, next) => {
  const User = await changePasswordFunc(
    req.body._id,
    req.body.password,
    req.body.newPassword,
  );
  await User.save();
  res.status(200).json({
    status: 'Success'
  })
});

/* Services */

/**
 * @description Protect middleware that checks if the sent token is correct and the user is logged in
 * @param {Object} req Request object.
 */

const protectService = async req => {
  let token = null;
  //getting token from header & removing bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You are not logged in! Please log in to access.', 401);
  }

  //verifying token
  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // error handling

  //finding user from token
  const foundUser = await user.findById(verified.id);
  
  if(!foundUser) {
    throw new AppError('The user belonging to this token no longer exists', 401);
  }
  req.user = foundUser;
};

/**
 * @description Protect middleware that checks if the sent token is correct and the user is logged in & is an Admin
 * @param {Object} req Request object.
 */

 const protectServiceAdmin = async req => {
  let token = null;
  //getting token from header & removing bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You are not logged in! Please log in to access.', 401);
  }

  //verifying token
  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET) // error handling

  //finding user from token
  const foundUser = await user.findById(verified.id);
  
  if(!foundUser) {
    throw new AppError('The user belonging to this token no longer exists', 401);
  }
  if(!foundUser.isAdmin) {
    throw new AppError('The user is not an admin', 401);
  }
  req.user = foundUser;
};

exports.protect = catchAsync(async (req, res, next) => {
  await protectService(req);
  next();
});

exports.protectAdmin = catchAsync(async (req, res, next) => {
  await protectServiceAdmin(req);
  next();
});

