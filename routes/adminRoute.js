const express = require('express');
const AppError = require('./../utils/appError');
const authenticationController = require('./../controllers/authentication');
const adminController = require('./../controllers/adminController');
const passportConfig = require('../config/passport');
const passport = require('passport');

const router = express.Router({mergeParams: true});

router.use(authenticationController.protectAdmin);

router.get('/user',adminController.getUsers);
router.get('/dashboard',adminController.dashboardStatistics);
router.get('/:username/reports',adminController.getReports);
router.delete('/:username/ban',adminController.banUser);

module.exports = router;

