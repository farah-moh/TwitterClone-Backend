const mongoose=require ('mongoose');
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('./../utils/email_info');

exports.updateUsername= catchAsync(async (req, res, next) => {
if(req.body.username.trim()=="")
{
    throw new AppError(
        `Username cannot be empty `,
        400
      );
}
try {
const User = await user.findOneAndUpdate({_id: req.user.id},{username: req.body.username});
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

exports.updateEmail = catchAsync(async (req, res, next) => {
    const User = await user.findOne({_id: req.user.id});
    if(req.body.email.trim()=="")
    {
        throw new AppError(
            `Email cannot be empty `,
            400
          );
    }
    const dupEmail = await user.findOne({email: req.body.email});
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

exports.protectTweets = catchAsync(async (req, res, next) => {
    const User = await user.findOne({_id: req.user.id});
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

exports.pushNotifications = catchAsync(async (req, res, next) => {
    const User = await user.findOne({_id: req.user.id});

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

exports.changeTheme = catchAsync(async (req, res, next) => {
    const User = await user.findOne({_id: req.user.id});
    console.log(User.theme);
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