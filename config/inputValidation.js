function validateUsername(elementValue){        
   var usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;  
   return usernamePattern.test(elementValue);   
}

function validateEmail(elementValue){        
   var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;  
   return emailPattern.test(elementValue);   
}

function validatePassword(elementValue){        
   var passwordPattern = /^[a-zA-Z0-9_-]{6,20}$/;  
   return passwordPattern.test(elementValue);   
}

function validateTruthValue(elementValue){
	var truthValuePattern = /^[a-zA-Z]{4,5}$/;  
	return truthValuePattern.test(elementValue);   
}


exports.username = validateUsername;
exports.email = validateEmail;
exports.password = validatePassword;
exports.truthValue = validateTruthValue;