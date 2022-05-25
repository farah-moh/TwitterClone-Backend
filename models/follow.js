/**
 * The follow object
 * @typedef {object} FOLLOW
 * @property {userObject} follower - The user which i follow
 * @property {userObject} following - The user which follows me
 */
const mongoose = require('mongoose');
const validator = require('validator');
const { stringify } = require('querystring');
const Schema = mongoose.Schema;

const followSchema = new Schema({
    
    follower: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    following: {
        type: Schema.ObjectId,
        ref: 'user'
    }

}, {timestamps: true})

const follow = mongoose.model('follow', followSchema);

module.exports = follow;