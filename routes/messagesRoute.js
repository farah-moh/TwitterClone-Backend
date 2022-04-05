const express = require('express');
const messagesController = require('./../controllers/messagesController');

const router = express.Router();

router.get('/',messagesController.chat);
router.get('/',messagesController.sendMessage);
router.get('/',messagesController.deleteMessage);

module.exports = router;