const router = require('express').Router()

const {
    createTweet
} = require ('../controllers/homePage');


router.post('/compose-tweet', createTweet);


module.exports = router;

