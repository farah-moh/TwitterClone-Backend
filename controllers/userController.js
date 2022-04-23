const crypto = require('crypto');
const { ObjectId } = require('mongoose').Types;
const user = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email_info');

const getEditProfile = async (userId) => {
    const userProfile = await user.findById(userId).select('image headerImage name bio country city website birthdate');
    return userProfile;
};

exports.getEditProfile = catchAsync(async (req, res, next) => {
    const userProfile = await getEditProfile(req.user.id);
    res.status(200).json(userProfile);
});
  