//index.js

var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var favicon = require('static-favicon');
var mongoose = require('mongoose');
var passport = require('passport');
var flash 	 = require('connect-flash');

var configDB = require('./config/database');
require('./config/passport')(passport); 

mongoose.connect(configDB.url);

app.configure(function() {

	app.use(express.logger('dev'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(favicon("public/images/favicon.ico")); 
	app.use(express.static(__dirname +  '/public'));

	app.set('view engine', 'ejs'); // set up ejs for templating

	// required for passport
	app.use(express.session({  
	    secret: "lolbuddiesisthebestgameever",  
	  })); 
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session

});

require('./app/routes.js')(app, passport); // load routes and pass in to app and passport


app.listen(port);
console.log('The magic happens on port ' + port);
