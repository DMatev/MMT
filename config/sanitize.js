var sanitizeHtml = require('sanitize-html');

function sanitizeHTML(content){
	return sanitizeHtml(content, { allowedTags: [ ]});
}

function toLowerCaseNoSpacing(x){
    var temp = '';
    for(var i=0; i<x.length; i++){
        if(x[i] !== ' '){
            temp = temp + x[i];
        }
    }
    return temp.toLowerCase();
}

exports.HTML = sanitizeHTML;
exports.username = toLowerCaseNoSpacing;
