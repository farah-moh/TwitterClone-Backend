const mongoose = require('mongoose');
const validator = require('validator');
const { stringify } = require('querystring');
const Schema = mongoose.Schema;
/**
 * The retweet model
 * @property {userObject} retweeter - The user who retweeted a tweet
 * @property {tweetObject} tweet - The tweet who got retweeted
 */
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