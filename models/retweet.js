const mongoose = require('mongoose');
const validator = require('validator');
const { stringify } = require('querystring');
const Schema = mongoose.Schema;

const retweetSchema = new Schema({
    
    retweeter: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    tweet: {
        type: Schema.ObjectId,
        ref: 'tweet'
    }

}, {timestamps: true})

const retweet = mongoose.model('retweet', retweetSchema);

module.exports = retweet;