var request = require("request"),
	mongodb = require('mongodb-wrapper'),
	db = mongodb.db("", 27017, 'ermahgerd'),
	async = require('async');

var str_split = function(string, split_length) {
	// http://kevin.vanzonneveld.net
	// +     original by: Martijn Wieringa
	// +     improved by: Brett Zamir (http://brett-zamir.me)
	// +     bugfixed by: Onno Marsman
	// +      revised by: Theriault
	// +        input by: Bjorn Roesbeke (http://www.bjornroesbeke.be/)
	// +      revised by: Rafał Kukawski (http://blog.kukawski.pl/)
	// *       example 1: str_split('Hello Friend', 3);
	// *       returns 1: ['Hel', 'lo ', 'Fri', 'end']
	if (split_length === null) {
		split_length = 1;
	}
	if (string === null || split_length < 1) {
		return false;
	}
	string += '';
	var chunks = [],
		pos = 0,
		len = string.length;
	while (pos < len) {
		chunks.push(string.slice(pos, pos += split_length));
	}
	return chunks;
};

var translate = function(word) {
	word = word.toUpperCase();
	// Don't translate short words
	if (word.length == 1) {
		return word;
	}

	// Handle specific words
	switch (word) {
		case 'AWESOME':			return 'ERSUM';
		case 'BANANA':			return 'BERNERNER';
		case 'BAYOU':			return 'BERU';
		case 'FAVORITE':
		case 'FAVOURITE':		return 'FRAVRIT';
		case 'GOOSEBUMPS':		return 'GERSBERMS';
		case 'LONG':			return 'LERNG';
		case 'MY':				return 'MAH';
		case 'THE':				return 'DA';
		case 'THEY':			return 'DEY';
		case 'WE\'RE':			return 'WER';
		case 'YOU':				return 'U';
		case 'YOU\'RE':			return 'YER';
	}

	// Before translating, keep a reference of the original word
	var originalWord = word;

	// Drop vowel from end of words
	if (originalWord.length > 2) {	// Keep it for short words, like "WE"
		word = word.replace(/[AEIOU]$/, '');
	}

	// Reduce duplicate letters
	word = word.replace(/[^\w\s]|(.)(?=\1)/gi, '');
	// Reduce adjacent vowels to one
	word = word.replace(/[AEIOUY]{2,}/g, 'E');	// TODO: Keep Y as first letter

	// DOWN -> DERN
	word = word.replace(/OW/g, 'ER');

	// PANCAKES -> PERNKERKS
	word = word.replace(/AKES/g, 'ERKS');

	// The mean and potatoes: replace vowels with ER
	word = word.replace(/[AEIOUY]/g, 'ER');		// TODO: Keep Y as first letter

	// OH -> ER
	word = word.replace(/ERH/g, 'ER');

	// MY -> MAH
	word = word.replace(/MER/g, 'MAH');

	// FALLING -> FERLIN
	word = word.replace('ERNG', 'IN');

	// POOPED -> PERPERD -> PERPED
	word = word.replace('ERPERD', 'ERPED');

	// MEME -> MAHM -> MERM
	word = word.replace('MAHM', 'MERM');

	// Keep Y as first character
	// YES -> ERS -> YERS
	if (originalWord.charAt(0) == 'Y') {
		word = 'Y' + word;
	}

	// Reduce duplicate letters
	word = word.replace(/[^\w\s]|(.)(?=\1)/gi, '');

	// YELLOW -> YERLER -> YERLO
	if ((originalWord.substr(-3) == 'LOW') && (word.substr(-3) == 'LER')) {
		word = word.substr(0, word.length - 3) + 'LO';
	}

	return word;
};

var last_id = null;
var url = "http://search.twitter.com/search.json?q=oh%20my%20god&rpp=10";


setInterval(function(){
	console.log("fetching...");
	if(last_id !== null){
		console.log("since: " + last_id);
		url += "?since_id=" + last_id;
	}
	request(url, function(err, response, body){
		if(!err && response.statusCode == 200){
			var queue = [];
			var json;

			try {
				json = JSON.parse(body);
			} catch(e){
				console.log(e);
				return;
			}

			for(var i = 0; i < json.results.length; i++){
				var job = (function(reserts){

					return function(cb){
					//if(reserts.id > last_id){
						var rergerx = /oh[ ]my[ ]god/gi;
						var translation = "";
						if(reserts.text.match(rergerx) !== null){
							var terkerns = reserts.text.split(" ");
							//console.log(terkerns);
							if(typeof terkerns !== 'undefined'){

								for(var j in terkerns){
									if(terkerns[j][0] != "@"){
										if(terkerns[j][0] == '#'){
											translation += " #" + translate(terkerns[j].slice(1, terkerns[j].length));
										} else {
											translation += " " + translate(terkerns[j]);
										}
									} else {
										translation += " " + terkerns[j];
									}
								}
							}

							var reply = "@" + reserts.from_user + ": " + translation;
							reserts.er_mah_gerd = reply;
						
							db.collection("twerts");

							last_id = reserts.id;

							db.twerts.find({id: reserts.id}).toArray(function(err, res){
								if(err === null){
									if(res.length == 0){
										db.twerts.save(reserts, function(err, post){
											console.log("saved " + reserts.id);
										});

									}
								}
							});

						}
					//}
					cb(null);
					};// end function
				})(json.results[i]);
				queue.push(job);
			}
			async.parallel(queue, function(err, result){
				console.log("done");
			});
		}
	});
}, 10000);


