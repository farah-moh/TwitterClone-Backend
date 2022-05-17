/**
 * The user object
 * @typedef {object} USER
 * @property {String} email - The email of the user
 * @property {Boolean} confirmed - The user confirmed email verification
 * @property {String} confirmEmailToken - The user email confirmation token
 * @property {Date} confirmEmailTokenExpiry - The expiry date of the mail confirmation token
 * @property {String} username - The username of the user
 * @property {String} password - The password of the user
 * @property {String} passwordResetToken - The user password reset token
 * @property {Date} passwordResetTokenExpiry -The expiry date of the password reset token
 * @property {String} facebookID - The facebook ID of the user 
 * @property {String} googleID - The google Id of the user
 * @property {Date} birthdate - The birthdate of the user
 * @property {String} name - The name of the user
 * @property {Array} following - Array of the following users obejcts
 * @property {Array} followers - Array of the follower users object
 * @property {Array} likedTweets - Array of te liked tweets
 * @property {Array} retweetedTweets - Array of te retweeted tweets
 * @property {String} image - The url containting the user image
 * @property {String} city - The city of the user
 * @property {String} country - The country of the user
 * @property {Boolean} notificationFlag - The notification enable
 * @property {Boolean} theme - The dark theme enable
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const { stringify } = require('querystring');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        unique: [true, 'Email already exits.'],
        required: [true, 'Email is required.'],
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Email is invalid.'],
    },

    confirmed: {
        type: Boolean,
        default: false
    },

    confirmEmailToken: String,
    confirmEmailTokenExpiry: Date,

    username: {
        type: String,
        unique: [true, 'Username already exists.' ],
        required: [true, 'Username is required.'],
        trim: true,
        minLength: 1,
        //maxLength: 25
        // validate: {
        //     validator: function (v) {
        //       return /^\S*$/i.test(v);
        //     },
        //     message: 'Invalid Name'
        //   }
    },

    password: {
        type: String,
        //required: [true, 'Password is required.'],
        trim: true,
        minLength: 8,
        maxLength: 64
    },

    passwordResetToken: String,
    passwordResetTokenExpiry: Date,

    facebookID: String,
    googleID: String,

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

    tweets: [{
        type: Schema.ObjectId,
        ref: 'tweet'
    }],

    likedTweets: [{
        type: Schema.ObjectId,
        ref: 'tweet'
    }],

    retweetedTweets: [{
        type: Schema.ObjectId,
        ref: 'tweet'
    }],

    reports: [{
        type: Schema.ObjectId,
        ref: 'report'
    }],

    image: {
        type: String,
        default: null
    },

    headerImage: {
        type: String,
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
    },

    theme: {
        type: String,
        enum: {values: ['light', 'dark']},
        default: 'light'
    },
    bio: {
        type: String,
        default: "",
        maxLength: 160
    },
    website: {
        type: String,
        //default: " ",
        validate: [validator.isURL, 'URL is invalid.']
    },
    protectedTweets: {
        type: Boolean,
        default: false
    },
    
    isAdmin: {
        type: Boolean,
        default: false
    }

},
    {timestamps: true},
)

/* ************** PRE's ************** */

userSchema.pre('save', async function (next) {
    // hash password whenever changed
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
})


/* ************** Methods ************** */

userSchema.methods.validatePassword = async function (candidatePassword, userPassword) {
    // validate correct password
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.generatePasswordResetToken = async function () {
    let resetToken;
    let ok = false;
    while(!ok) {
        //generate token
        resetToken = crypto.randomBytes(32).toString('hex');
        this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        //check if it exists before
        const isUnique = await this.model('user').find({
            passwordResetToken: this.passwordResetToken
        });

        //if unique, break
        if(isUnique.length === 0) {
            ok = 1;
        }
    }
    this.passwordResetTokenExpiry = Date.now() + 7 * 60 * 1000;
    await this.save({
      validateBeforeSave: false
    });
    return resetToken;
}

userSchema.methods.generateEmailConfirmToken = async function () {
    let cofirmToken;
    let ok = false;
    while(!ok) {
        //generate token
        cofirmToken = crypto.randomBytes(32).toString('hex');
        this.confirmEmailToken = crypto.createHash('sha256').update(cofirmToken).digest('hex');

        //check if it exists before
        const isUnique = await this.model('user').find({
            confirmEmailToken: this.confirmEmailToken
        });

        //if unique, break
        if(isUnique.length === 0) {
            ok = 1;
        }
    }
    await this.save({
      validateBeforeSave: false
    });
    return cofirmToken;
}
  
const user = mongoose.model('user', userSchema);

module.exports = user;