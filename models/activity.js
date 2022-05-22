/**
 * The activity object
 * 
 * @typedef {object} ACTIVITY
 * @property {userObject} sender - The sender user
 * @property {userObject} receiver - The receiver user
 * @property {String} activityType - The type of the activity one of four types
 * @property {tweetObject} tweet - The tweet concerning the activity
 */

const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    sender: {
        type: Schema.ObjectId,
        ref: 'user'
       // required: true
    },

    receiver: {
        type: Schema.ObjectId,
        ref: 'user'
        //required: true
    },

    activityType: {
        type: String,
        enum: ['follow','retweet','reply','tag', 'like', 'quoteRetweet', 'vote'],
        required: true
    },

    tweet: {
        type: Schema.ObjectId,
        ref: 'tweet'
    },

},
    {timestamps: true},
)

const activity = mongoose.model('activity', activitySchema);

module.exports = activity;