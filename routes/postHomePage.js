const router = require('express').Router()
const authenticationController = require('./../controllers/authentication');
const userController = require('./../controllers/userController');
const whoToFollowController = require('./../controllers/whoToFollowController');

const {
    postTweet,
    getTweets,
    likeTweet,
    createTweet,
    createUser,
    makeRetweet,
    makeReply,
    showUsers,
    getRetweeters,
    getLikers,
    getTaggedUsers,
    getReplies,
    makeQuoteRetweet,
    getNotifications,
    makePollChoice,
    bookmarkTweet,
    deleteNotification,
    deleteTweet,
    getTweetById,
    patchNotification,
    deleteBookmarkedTweets,
    getBookmarkedTweets,
    getRetweetsUser
} = require ('../controllers/homePage');

router.use(authenticationController.protect);

router.get('/', getTweets);
router.get('/showUsers', showUsers);
router.get('/getRetweets', getRetweetsUser);
router.get('/bookmarkedTweets', getBookmarkedTweets)

router.get('/:tweetId/getRetweeters', getRetweeters);
router.get('/:tweetId/getReplies', getReplies);
router.get('/:tweetId/getLikers', getLikers);
router.get('/:tweetId/getTaggedUsers', getTaggedUsers);
router.get('/:tweetId/getTweetById', getTweetById);
router.get('/getNotifications', getNotifications);

router.post('/createUser', createUser);
router.post('/createTweet', createTweet);

router.post('/compose-tweet', postTweet);


router.post('/:tweetId/bookmarkTweet', bookmarkTweet);
router.post('/:tweetId/likeTweet', likeTweet);
router.post('/:tweetId/retweet', makeRetweet);
router.post('/:tweetId/quoteRetweet', makeQuoteRetweet);
router.post('/:tweetId/reply', makeReply);
router.post('/:tweetId/makePollChoice', makePollChoice);


router.delete('/:notificationId/deleteNotification', deleteNotification);
router.delete('/:tweetId/deleteTweet', deleteTweet);
router.delete('/deleteBookmarkedTweets', deleteBookmarkedTweets)

router.patch('/:notificationId/patchNotification', patchNotification)
router.get('/Follow-requests', userController.getFollowRequests);
router.post('/Follow-requests/accept', userController.acceptFollowRequests);
router.delete('/Follow-requests/reject',userController.rejectFollowRequests);
router.get('/Who-to-follow',whoToFollowController.whoToFollow);

module.exports = router;

