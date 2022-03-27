const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
    sender: {
        type: Schema.ObjectId,
        ref: 'user',
        required: true
    },

    receiver: {
        type: Schema.ObjectId,
        ref: 'user',
        required: true
    },

    activityType: {
        type: String,
        enum: ['follow','favorite','retweet','reply'],
        required: true
    },

    tweet: {
        type: Schema.ObjectId,
        ref: 'tweet',
        default: ''
    },

},
    {timestamps: true},
)

const activity = mongoose.model('activity', activitySchema);

module.exports = activity;