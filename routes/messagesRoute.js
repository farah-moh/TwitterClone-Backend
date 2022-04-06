const express = require('express');
const messagesController = require('./../controllers/messagesController');

const router = express.Router({ mergeParams: true });

router.get('/',messagesController.chat);
router.post('/',messagesController.sendMessage);
router.delete('/',messagesController.deleteMessage);

module.exports = router;