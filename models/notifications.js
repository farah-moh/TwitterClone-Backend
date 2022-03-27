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
    }
})

const notification = mongoose.model('notification', notificationSchema);

module.exports = notification;