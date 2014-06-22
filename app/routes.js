var User = require('../app/models/user');
var inputValidation = require('../config/inputValidation');
var request = require('request');
var sanitize = require('../config/sanitize');

module.exports = function(app, passport) {

	app.get('/', function(req, res) {
		if (req.isAuthenticated()){
			res.redirect('/main');
		}
		else {
			res.render('index.ejs', { message: req.flash('loginMessage') }); 
		}
		
	});

	app.get('/signup', function(req, res) {
		if (req.isAuthenticated()){
			res.redirect('/main');
		}
		else {
			res.render('signup.ejs', { message: req.flash('signupMessage') }); 
		}
		
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/main',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/main',
		failureRedirect : '/',
		failureFlash : true
	}));

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/main', isLoggedIn, function(req, res) {
		res.render('main.ejs', { username: req.user.username, lolid: req.user.lolid, lolserver: req.user.lolserver, lolacc: req.user.lolacc });
	});

	app.get('/api/friends', isLoggedIn, function(req, res) {
		res.json({ friendList: req.user.friendList });
	});

	app.post('/api/friends/add', isLoggedIn, function(req, res) {
		var username = sanitize.HTML(req.body.username), lolacc = sanitize.HTML(req.body.lolacc), lolserver = sanitize.HTML(req.body.lolserver);
		if (!inputValidation.username(username)){
			res.json({ validation : 'Username must contain only letters, numbers or symbols "-", " _" with min 3 and max 20 symbols' });
			return ;
		}
		if (!inputValidation.LOLServer(lolserver)){
			res.json({ validation : 'The allowed server are EUW and EUNE' });
			return ;
		}
		request('https://euw.api.pvp.net/api/lol/' + lolserver + '/v1.4/summoner/by-name/' + lolacc + '?api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
            if (response.statusCode == 404) {
               res.json({ validation : 'That lol account dont exist' });
               return;
            }
            if (response.statusCode == 200) {
            	var lolusername = sanitize.username(lolacc);
				req.user.update({ $push: {'friendList': {'username': username, 'lolid': JSON.parse(body)[lolusername].id, 'lolacc': lolacc, 'lolusername': lolusername, 'lolserver': lolserver } } }, function(err) {
					if(err){
						res.json({ error: err });
					} else {
						res.json({ message: 'friend added' });
					}					
				});
            }
        });
	});

	app.post('/api/friends/delete/:user_id', isLoggedIn, function(req, res){
		var user_id = sanitize.HTML(req.params.user_id);
		User.update({ '_id': req.user._id, 'friendList': { $elemMatch: { '_id': user_id } } }, 
			{ $pull: { 'friendList': { '_id': user_id } } }, function(err) {
				if(err){
					res.json({ error : err })
				} else {
					res.json({ message : 'deleted successfully' });
				}
		});	
	});

	app.get('/api/history/:server/:id', isLoggedIn, function(req, res) {
		id = sanitize.HTML(req.params.id);
		lolserver = sanitize.HTML(req.params.server);
		if (!inputValidation.LOLServer(lolserver)){
			res.json({ validation : 'The allowed server are EUW and EUNE' });
			return ;
		}
		request('https://euw.api.pvp.net/api/lol/' + lolserver + '/v1.3/game/by-summoner/' + id + '/recent?api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
		    if (response.statusCode == 404) {
		        res.json({ error : 'error' });
		        return;
		    }
		    if (response.statusCode == 200) {
		        var data = JSON.parse(body), history = { 
		           games: [] 
		        };
		        getSummoners(req.user.lolserver, function(allSummoners){
			        getChampions(req.user.lolserver, function(allChampions){
			        	getItems(req.user.lolserver, function(allItems){
				        	for(var i=0; i<data.games.length; i++){
				        		var champion = searchKeyById(allChampions, data.games[i].championId);
				        		var summoner1 = searchKeyById(allSummoners, data.games[i].spell1);
				        		var summoner2 = searchKeyById(allSummoners, data.games[i].spell2);
	
				        		history.games.push({
			        				"isWon": data.games[i].stats.win,
							        "player": {
							        	"team" : data.games[i].teamId,
										"champion": {
											"name" : champion.name, 
											"img" : {
												"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/champion/" + champion.image.full,
												"sprite" : {
													"height" : champion.image.h + "px",
													"width" : champion.image.w + "px",
													"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + champion.image.sprite + "') -" + champion.image.x + "px -" + champion.image.y + "px no-repeat"
												}
											}
										},
										"summoners" : {
											"spell1": {
												"name" : summoner1.name, 
												"img" : {
													"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/spell/" + summoner1.image.full,
													"sprite" : {
														"height" : summoner1.image.h + "px",
														"width" : summoner1.image.w + "px",
														"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + summoner1.image.sprite + "') -" + summoner1.image.x + "px -" + summoner1.image.y + "px no-repeat"
													}
												}
											},
											"spell2": {
												"name" : summoner2.name, 
												"img" : {
													"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/spell/" + summoner2.image.full,
													"sprite" : {
														"height" : summoner2.image.h + "px",
														"width" : summoner2.image.w + "px",
														"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + summoner2.image.sprite + "') -" + summoner2.image.x + "px -" + summoner2.image.y + "px no-repeat"
													}
												}
											}
										},
										"KDA" : {
											"kills" : data.games[i].stats.championsKilled,
											"deaths" : data.games[i].stats.numDeaths,
											"assists" : data.games[i].stats.assists
										},
										"items": []
									},
									"teams": []
								});
		        				if (data.games[i].stats.item0){
				        			item0 = searchKeyById(allItems, data.games[i].stats.item0);
				        			history.games[i].player.items.push({
										"name": item0.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item0.image.full,
											"sprite" : {
												"height" : item0.image.h + "px",
												"width" : item0.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item0.image.sprite + "') -" + item0.image.x + "px -" + item0.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
				        		if (data.games[i].stats.item1){
				        			item1 = searchKeyById(allItems, data.games[i].stats.item1);
				        			history.games[i].player.items.push({
										"name": item1.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item1.image.full,
											"sprite" : {
												"height" : item1.image.h + "px",
												"width" : item1.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item1.image.sprite + "') -" + item1.image.x + "px -" + item1.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
				        		if (data.games[i].stats.item2){
				        			item2 = searchKeyById(allItems, data.games[i].stats.item2);
				        			history.games[i].player.items.push({
										"name": item2.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item2.image.full,
											"sprite" : {
												"height" : item2.image.h + "px",
												"width" : item2.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item2.image.sprite + "') -" + item2.image.x + "px -" + item2.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
				        		if (data.games[i].stats.item3){
				        			item3 = searchKeyById(allItems, data.games[i].stats.item3);
				        			history.games[i].player.items.push({
										"name": item3.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item3.image.full,
											"sprite" : {
												"height" : item3.image.h + "px",
												"width" : item3.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item3.image.sprite + "') -" + item3.image.x + "px -" + item3.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
				        		if (data.games[i].stats.item4){
				        			item4 = searchKeyById(allItems, data.games[i].stats.item4);
				        			history.games[i].player.items.push({
										"name": item4.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item4.image.full,
											"sprite" : {
												"height" : item4.image.h + "px",
												"width" : item4.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item4.image.sprite + "') -" + item4.image.x + "px -" + item4.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
				        		if (data.games[i].stats.item5){
				        			item5 = searchKeyById(allItems, data.games[i].stats.item5);
				        			history.games[i].player.items.push({
										"name": item5.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item5.image.full,
											"sprite" : {
												"height" : item5.image.h + "px",
												"width" : item5.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item5.image.sprite + "') -" + item5.image.x + "px -" + item5.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
				        		if (data.games[i].stats.item6){
				        			item6 = searchKeyById(allItems, data.games[i].stats.item6);
				        			history.games[i].player.items.push({
										"name": item6.name,
										"img" : { 
											"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/item/" + item6.image.full,
											"sprite" : {
												"height" : item6.image.h + "px",
												"width" : item6.image.w + "px",
												"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + item6.image.sprite + "') -" + item6.image.x + "px -" + item6.image.y + "px no-repeat"
											}
										}	
				        			});
				        		}
								for(var j=0; j< data.games[i].fellowPlayers.length; j++){
									var champ = searchKeyById(allChampions, data.games[i].fellowPlayers[j].championId);
									history.games[i].teams.push({
										"player" : {										
											"teamId" : data.games[i].fellowPlayers[j].teamId,
											"champion": {
												"name" : champ.name,
												"img" : {
													"full" : "http://ddragon.leagueoflegends.com/cdn/4.9.1/img/champion/" + champ.image.full,
													"sprite" : {
														"height" : champ.image.h + "px",
														"width" : champ.image.w + "px",
														"background" : "url('//ddragon.leagueoflegends.com/cdn/4.9.1/img/sprite/" + champ.image.sprite + "') -" + champ.image.x + "px -" + champ.image.y + "px no-repeat"
													}
												}
											}
										}
									});
								}
			        		}
			        		res.json({history: history});
			        	});
		       		});
		        });		     
			}
		});
	
	});

	app.get('/api/historyall', isLoggedIn, function(req, res) {
		request('https://euw.api.pvp.net/api/lol/' + req.user.lolserver + '/v1.3/game/by-summoner/' + req.user.lolid + '/recent?api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
            if (response.statusCode == 404) {
               res.json({ error : 'error' });
               return;
            }
            if (response.statusCode == 200) {
            	var data = JSON.parse(body), history = { 
            		games: [] 
            	};
				res.json({data: data});
			}
        });
	});

};


function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/');
	}	
}


function searchKeyById(data, id){
	for (var key in data.data) {
		if (data.data.hasOwnProperty(key)) {
  			if(data.data[key].id === id){
   				return data.data[key];
  			}
  		}
	}
}


function getSummoners(server, next){
	request('https://global.api.pvp.net/api/lol/static-data/' + server + '/v1.2/summoner-spell?spellData=image&api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
		if (response.statusCode == 404) {
		    return 'error';
		}
		if (response.statusCode == 200) {
		    var allSpells = JSON.parse(body);
			next(allSpells);
		}
	});
}

function getChampions(server, next){
	request('https://global.api.pvp.net/api/lol/static-data/' + server + '/v1.2/champion?champData=image&api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
		if (response.statusCode == 404) {
		    return 'error';
		}
		if (response.statusCode == 200) {
		    var allChampions = JSON.parse(body);
			next(allChampions);
		}
	});
}

function getItems(server, next){
	request('https://global.api.pvp.net/api/lol/static-data/' + server + '/v1.2/item?itemListData=image&api_key=751902db-247b-49c9-b2cb-2ec83465b2ad', function (error, response, body) {
		if (response.statusCode == 404) {
		    return 'error';
		}
		if (response.statusCode == 200) {
		    var allItems = JSON.parse(body);
			next(allItems);
		}
	});
}
