const router = require('express').Router()


const {
    postTweet
} = require ('../controllers/homePage');


router.post('/compose-tweet', postTweet);


module.exports = router;

