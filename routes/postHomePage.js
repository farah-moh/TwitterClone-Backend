const router = require('express').Router()


const {
    postTweet,
    getTweets,
    likeTweet,
    createTweet,
    createUser,
    makeRetweet,
    makeReply,
    showUsers,
    getRetweets,
    getLikers,
    getTaggedUsers,
    getReplies
} = require ('../controllers/homePage');

router.get('/', getTweets);
router.get('/showUsers', showUsers);
router.get('/:tweetId/likeTweet', likeTweet);

router.get('/:tweetId/getRetweets', getRetweets);
router.get('/:tweetId/getReplies', getReplies);
router.get('/:tweetId/getLikers', getLikers);
router.get('/:tweetId/getTaggedUsers', getTaggedUsers);

router.post('/createUser', createUser);
router.post('/createTweet', createTweet);

router.post('/compose-tweet', postTweet);

router.post('/retweet', makeRetweet);
router.post('/reply', makeReply);

module.exports = router;

