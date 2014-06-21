var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({

    username : String,
    password : String,
    email : String,
    role : String,
    lolid: String,
    lolacc: String,
    lolusername: String,
    lolserver: String,
    friendList: [ { 
        username: String,
        lolid: String, 
        lolacc: String, 
        lolusername: String,
        lolserver: String,
    } ]
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password);
};


userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);