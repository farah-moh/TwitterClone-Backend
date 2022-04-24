/**
 * The tweet object
 * @typedef {object} TWEET
 * @property {userObject} user - The user who posted the tweet
 * @property {String} body - The body of the tweet
 * @property {Boolean} isReply - Checking the tweet is replied or normal tweer
 * @property {Array} media - Array of the media of the tweet
 * @property {Array} favoriters - Array of the users making the tweet favorite
 * @property {Array} retweeters - Array of the users who retweeted the tweet
 * @property {Array} replies - Array of the replies on the tweet
 * @property {Array} taggedUsers - Array of the tagged users in the tweet
 */

const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'user',
        required: true
    },

    body: {
        type: String,
        minLength: 1,
        maxLength: 280,
        trim: true
    },
    isReply:{
        type: Boolean,
        default: false
    },

    media: {
        type: [String],
        default: null
    },

    favoriters: [{
        type: Schema.ObjectId,
        ref: 'user'
    }],

    retweeters: [{
        type: Schema.ObjectId,
        ref: 'user'
    }],

    replies: [{
        type: Schema.ObjectId,
        ref: 'tweet'
    }],

    //can't tag more than 10 users
    taggedUsers: {
        type: [{
            type: Schema.ObjectId,
            ref: 'user'
          }],
        validate: {
            validator: function (value) {
            return (value.length <= 10);
          }
        }
    }
},
    {timestamps: true},
)



const tweet = mongoose.model('tweet', tweetSchema);



module.exports = tweet;