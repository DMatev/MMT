var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');
var inputValidation = require('./inputValidation');
var sanitize = require('./sanitize');
var request = require('request');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true 
    }, function(req, username, password, done) {
        var email = sanitize.HTML(req.body.email);
        var lolacc = sanitize.HTML(req.body.lolacc);
        var lolserver = sanitize.HTML(req.body.lolserver);
        username = sanitize.HTML(username);
        password = sanitize.HTML(password);

        if (!inputValidation.username(username)){
            return done(null, false, req.flash('signupMessage', 'Username must contain only letters, numbers or symbols "-", " _" with min 3 and max 20 symbols'));
        }

        if (!inputValidation.password(password)){
            return done(null, false, req.flash('signupMessage', 'Password must contain only letters, numbers or symbols "-", " _" with min 6 and max 20 symbols'));
        }

        if (!inputValidation.email(email)){
             return done(null, false, req.flash('signupMessage', 'That email addres is invalid'));
        }

        if (!inputValidation.LOLServer(lolserver)){
             return done(null, false, req.flash('signupMessage', 'That lolserver is invalid'));
        }

        request('https://euw.api.pvp.net/api/lol/' + lolserver + '/v1.4/summoner/by-name/' + lolacc + '?api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
            if (response.statusCode == 404) {
                return done(null, false, req.flash('signupMessage', 'That account dont exist'))
            }
            if (response.statusCode == 200) {
                process.nextTick(function() {
                    User.findOne({ 'username' :  username }, function(err, user) {
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                        } else {
                            User.findOne({ 'email' :  email }, function(err, usr) {
                                if (usr) {
                                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                                } else {
                                    var lolusername = sanitize.username(lolacc);
                                    var newUser = new User();
                                    newUser.username = username; 
                                    newUser.password = newUser.generateHash(password);
                                    newUser.email = email;
                                    newUser.lolid = JSON.parse(body)[lolusername].id;
                                    newUser.lolacc = lolacc;
                                    newUser.lolusername = lolusername;
                                    newUser.lolserver = lolserver;
                                    newUser.save(function() {
                                        return done(null, newUser);
                                    });
                                }
                            });    
                        }
                    });
                });
            }
        });

       
    }));

    passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    }, function(req, username, password, done) {
        username = sanitize.HTML(username);
        password = sanitize.HTML(password);

        if (!inputValidation.username(username)){
            return done(null, false, req.flash('loginMessage', 'That username is invalid')); 
        }
        if (!inputValidation.password(password)){
            return done(null, false, req.flash('loginMessage', 'That password is invalid')); 
        }
        User.findOne({ 'username' : username  }, function(err, user) { 
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found')); 

            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password'));

            return done(null, user);
        });
    }));

};