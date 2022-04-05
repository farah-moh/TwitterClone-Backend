const router = require('express').Router()


const {
    postTweet,
    getTweets,
    likeTweet,
    createTweet,
    createUser
} = require ('../controllers/homePage');

router.get('/', getTweets);
router.get('/:tweetId/likeTweet', likeTweet);

router.post('/createUser', createUser);
router.post('/createTweet', createTweet);

router.post('/compose-tweet', postTweet);


module.exports = router;

