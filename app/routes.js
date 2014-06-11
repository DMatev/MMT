var User = require('../app/models/user');
var inputValidation = require('../config/inputValidation');
var sanitizeHtml = require('sanitize-html');

module.exports = function(app, passport) {

	// home page
	app.get('/', function(req, res) {
		res.render('index.ejs'); 
	});


	// login page
	app.get('/login', function(req, res) {
		if (req.isAuthenticated()){
			res.redirect('/profile');
		} else {
			res.render('loginSystem/login.ejs', { message: req.flash('loginMessage') }); 
		}
	});
	
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));


};


function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	
	res.redirect('/');
}

function sanitizeHTML(content){
	return sanitizeHtml(content, { allowedTags: [ ]});
}

function sanitizeNews(content){
	return sanitizeHtml(content, { allowedTags: [ 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'b', 'i', 'strong', 'em', 'strike'],
		selfClosing: [ 'br'] });
}