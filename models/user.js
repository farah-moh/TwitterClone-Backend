const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        unique: [true, 'Email already exits.'],
        required: [true, 'Email is required.'],
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Email is invalid.']
    },

    username: {
        type: String,
        unique: [true, 'Username already exists.' ],
        required: [true, 'Username is required.'],
        trim: true,
        // validate: {
        //     validator: function (v) {
        //       return /^\S*$/i.test(v);
        //     },
        //     message: 'Invalid Name'
        //   }
    },

    password: {
        type: String,
        required: [true, 'Password is required.'],
        trim: true,
        minLength: 8,
        maxLength: 64
    },

    birthdate: {
        type: Date,
        required: [true, 'Birthdate is required.'],
        validate: {
            validator: function (date) {
              const currentYear = new Date().getFullYear();
              const userYear = date.getFullYear();
              return (userYear <= currentYear - 13);
            },
            message: 'User should be older than 13 years old.'
        }
    },

    name: {
        type: String,
        required: [true, 'Name is required.'],
        minLength: 1,
        maxLength: 64,
        //validate: 
    },

    following: [{
        type: Schema.ObjectId,
        ref: 'user'
    }],

    followers: [{
        type: Schema.ObjectId,
        ref: 'user'
    }],

    likedTweets: [{
        type: Schema.ObjectId,
        ref: 'tweet'
    }],

    retweetedTweets: [{
        type: Schema.ObjectId,
        ref: 'tweet'
    }],

    image: {
        type: [String],
        default: null
    },

    city: {
        type: String,
        default: null
    },

    country: {
        type: String,
        default: null
    },

    notificationFlag: {
        type: Boolean,
        default: true
    }

},
    {timestamps: true},
)

const user = mongoose.model('user', userSchema);

module.exports = user;