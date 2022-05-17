const express = require('express');
const authenticationController = require('./../controllers/authentication');
const searchController = require('../controllers/searchController');

const router = express.Router({ mergeParams: true });

router.use(authenticationController.protect);
router.get('/',searchController.search);

module.exports = router;