const mongoose=require ('mongoose');
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('./../utils/email_info');

const changeUsername= async(id,username) => {
  const User = await user.findOneAndUpdate({_id: id},{username: username});
  return User;
}
exports.changeUsername = changeUsername;

const userById= async(id) => {
  const User = await user.findOne({_id: id});
  return User;
}
exports.userById = userById;
const userByEmail= async(Email) => {
  const User = await user.findOne({email: Email});
  return User;
}
exports.userByEmail = userByEmail;

/**
 * @description This function is used to used to modify the current username
 * @param {*} req 
 * @param {*} res
 * @param {middleware} next
 * @returns {Object} Returns the status code of the username
 */
exports.updateUsername= catchAsync(async (req, res, next) => {
if(req.body.username.trim()=="")
{
    throw new AppError(
        `Username cannot be empty `,
        400
      );
}
try {
const User = await changeUsername(req.user.id,req.body.username); 
await User.save();

return res.status(200).json({status: 'Success', success: true});
}
catch (err) {
    throw new AppError(
        `Something went wrong`,
        500
      );
  }
}
);

/**
 * @description This function is used to used to modify the current email
 * @param {*} req 
 * @param {*} res
 * @param {middleware} next
 * @returns {Object} Returns the status code of the email
 */
exports.updateEmail = catchAsync(async (req, res, next) => {
    const User = await userById(req.user.id);
    if(req.body.email.trim()=="")
    {
        throw new AppError(
            `Email cannot be empty `,
            400
          );
    }
    const dupEmail = await userByEmail(req.body.email);
    if(dupEmail)
    {
        throw new AppError(
            `Email already exists`,
            409
          );
    }
    User.email = req.body.email;


    const emailConfirmationToken = await User.generateEmailConfirmToken();

    const confirmEmailText = 
    `Click this link to confirm your email\n
    http://localhost:${process.env.PORT}/signup-confirm/${emailConfirmationToken}\n`;

    try {
      
      await sendEmail({
        email: User.email,
        subject: `Account Confirmation Token ${confirmEmailText}`,
        message: confirmEmailText
      });
      res.status(200).json({
        status: 'success',
        message: 'Check your email for confirmation.'
      });
    } catch (err) {
      User.confirmEmailToken = undefined;
      User.confirmEmailTokenExpiry = undefined;
      await User.save({
        validateBeforeSave: false
      });
      throw new AppError(
        `There was an error sending the confirmation email. Try again. ${err} `,
        500
      );
    }

    await User.save();

    
});

/**
 * @description This function is used to used to turn protected tweets option on/off
 * @param {*} req 
 * @param {*} res
 * @param {middleware} next
 * @returns {Object} Returns the status code of the protected tweets
 */
exports.protectTweets = catchAsync(async (req, res, next) => {
    const User = await userById(req.user.id);
    if(User.protectedTweets==true)
    {
    User.protectedTweets=false;
    }
    else
    {
    User.protectedTweets=true;
    }

    try {
        await User.save();
        return res.status(200).json({status: 'Success', success: true});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }
});

/**
 * @description This function is used to used to turn push notifications option on/off
 * @param {*} req 
 * @param {*} res
 * @param {middleware} next
 * @returns {Object} Returns the status code of the notifications
 */
exports.pushNotifications = catchAsync(async (req, res, next) => {
    const User = await userById(req.user.id);

    if(User.notificationFlag==true)
    User.notificationFlag=false;
    else
    User.notificationFlag=true;
    
    try {
        await User.save();
        return res.status(200).json({status: 'Success', success: true});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }
});

/**
 * @description This function is used to used to switch to light/dark mode
 * @param {*} req 
 * @param {*} res
 * @param {middleware} next
 * @returns {Object} Returns the status code of the theme
 */
exports.changeTheme = catchAsync(async (req, res, next) => {
    const User = await userById(req.user.id);
    if (req.body.theme=="light")
    {
       User.theme="light";
    }
    else if(req.body.theme=="dark")
    {
        User.theme="dark";
    }
    try {
        await User.save();
        return res.status(200).json({status: 'Success', success: true});
        }
        catch (err) {
            throw new AppError(
                `Something went wrong`,
                500
              );
          }
});

exports.deactivateAccount = catchAsync(async (req, res, next) => {
  const User = await userById(req.user.id);

  if(User.deactivated==true)
  User.deactivated=false;
  else
  User.deactivated=true;
  
  try {
      await User.save();
      return res.status(200).json({status: 'Success', success: true});
      }
      catch (err) {
          throw new AppError(
              `Something went wrong`,
              500
            );
        }
});