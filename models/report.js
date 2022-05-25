const mongoose = require('mongoose');
const validator = require('validator');
const { stringify } = require('querystring');
const Schema = mongoose.Schema;
/**
 * The report object
 * @typedef {object} REPORT
 * @property {String} message - The report messages
 * @property {userObject} whoReported - The user who reported
 * @property {userObject} reported - The user who got reported
 * @property {enum} type - The number of the report message
 */

const reportsSchema = new Schema({
    message: { 
        type: String,
        enum: 
        [
        'I\'m not interested in this account.',
        'It\'s suspicious or spam.',
        'It appears their account is hacked.',
        'They are pretending to be me or someone else.',
        'Their tweets are abusive or hateful.',
        'They are expressing intentions of self-harm or suicide'
        ],
    },

    whoReported: {
        type: Schema.ObjectId,
        ref: 'user'
    },

    reported: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    type: {
        type: Number,
        enum: [1,2,3,4,5,6]
    }
})

const report = mongoose.model('report', reportsSchema);

module.exports = report;