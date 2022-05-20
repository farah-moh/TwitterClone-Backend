/**
 * The notification object
 * @typedef {object} NOTIFICATION
 * @property {activityObject} activity - The activity happening
 * @property {String} notificationStream - The text sent in the notifications
 */

const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    activity: { 
        type: Schema.ObjectId, 
        ref: "activity" 
    },

    notificationStream: {
        type: String
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    status:{
        type: Boolean,
        default: true
    }
})

const notification = mongoose.model('notification', notificationSchema);

module.exports = notification;