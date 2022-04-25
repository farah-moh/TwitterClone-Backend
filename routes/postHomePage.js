const router = require('express').Router()
const authenticationController = require('./../controllers/authentication');

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

router.use(authenticationController.protect);

router.get('/', getTweets);
router.get('/showUsers', showUsers);

router.get('/:tweetId/getRetweets', getRetweets);
router.get('/:tweetId/getReplies', getReplies);
router.get('/:tweetId/getLikers', getLikers);
router.get('/:tweetId/getTaggedUsers', getTaggedUsers);

router.post('/createUser', createUser);
router.post('/createTweet', createTweet);

router.post('/compose-tweet', postTweet);

router.post('/:tweetId/likeTweet', likeTweet);
router.post('/retweet', makeRetweet);
router.post('/reply', makeReply);

module.exports = router;

