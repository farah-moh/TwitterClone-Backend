const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const User = require('../models/user');
const genUsername = require("unique-username-generator");
require('dotenv').config();

passport.use(
    new FacebookTokenStrategy(
        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_PASSWORD
        }, 
        async function(accessToken, refreshToken, profile, done) {
            try {
                const { _json: profileInfo } = profile;
                // Check if user signed up before using facebook
                const userExists = await User.findOne({ facebookID: profile.id })
            
                if (userExists) {
                  return done(null, userExists)
                }
                let ok = false;
                let random_username;

                while(!ok) {
                    random_username = genUsername.generateFromEmail(
                        profileInfo.email,
                        3
                    );
                    //check if it exists before
                    const usernameExists = User.findOne({ username: random_username })

                    //if unique, break
                    if(!usernameExists) {
                    ok = 1;
                    }
                }

                // Create new user 
                const newUser = new User({
                    name: profileInfo.first_name,
                    username: random_username,
                    email: profileInfo.email,
                    birthdate: profileInfo.birthday,
                    facebookID: profile.id,
                    confirmed: true
                })
            
                await newUser.save()
                done(null, newUser)
              } 
              catch (error) {
                done(error, false, error.message)
              }
        }
    )
)
module.exports = passport;