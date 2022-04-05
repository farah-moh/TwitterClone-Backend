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
        maxLength: 25
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

    passwordResetToken: String,
    passwordResetTokenExpiry: Date,

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
      //validateBeforeSave: false
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
      //validateBeforeSave: false
    });
    return cofirmToken;
}
  
const user = mongoose.model('user', userSchema);

module.exports = user;