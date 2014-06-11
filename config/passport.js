var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');
var inputValidation = require('./inputValidation');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // local-signup
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function(req, username, password, done) {
        if (!inputValidation.username(username)){
            return done(null, false, req.flash('signupMessage', 'Username must contain only letters, numbers or symbols "-", " _" with min 3 and max 20 symbols'));
        }

        if (!inputValidation.password(password)){
            return done(null, false, req.flash('signupMessage', 'Password must contain only letters, numbers or symbols "-", " _" with min 6 and max 20 symbols'));
        }

        if (!inputValidation.email(req.body.email)){
             return done(null, false, req.flash('signupMessage', 'That email addres is invalid'));
        }

        if(!inputValidation.email(req.body.repeatEmail)){
           return done(null, false, req.flash('signupMessage', 'That email addres is invalid'));
        }

        if(req.body.email !== req.body.repeatEmail){
            return done(null, false, req.flash('signupMessage', 'Your email and Re-enter Email must be the same'));
        }
        process.nextTick(function() {
            User.findOne({ 'username' :  username }, function(err, user) {
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    User.findOne({ 'account.email' :  req.body.email }, function(err, email) {
                        if (email) {
                            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                        } else {
                            var newUser = new User();
                            newUser.username = username; 
                            newUser.password = newUser.generateHash(password);
                            newUser.email = req.body.email;
                            newUser.role = "user";
                            newUser.save(function() {
                                return done(null, newUser);
                            });
                        }
                    });    
                }
            });
        });
    }));

    // local-login
    passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    }, function(req, username, password, done) {
        if (!inputValidation.username(username)){
            return done(null, false, req.flash('loginMessage', 'That username is invalid')); 
        }
        if (!inputValidation.password(password)){
            return done(null, false, req.flash('loginMessage', 'That password is invalid')); 
        }
        User.findOne({ 'account.username' : username  }, function(err, user) { 
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); 

            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

            return done(null, user);
        });
    }));

};