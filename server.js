/* https://github.com/tropo/tropo-webapi-node */
var tropowebapi = require('tropo-webapi');
/* Express framwork http://expressjs.com */
var express = require('express');
/* http://mongoosejs.com/ */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/track');
mongoose.connect(URI);

//connect to mongodb	
var db = mongoose.connection;
var Tracking;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	//new schema
	var trackingSchema = mongoose.Schema({
	    from: String,
		choice: String
	});
	Tracking = mongoose.model('Tracking', trackingSchema);
});

var app = express();
var from;
/* constants */
var RECRUITER = "1";
var OTHER = "2";
var EMAIL = 'example@gmail.com';
var BIRTHYEAR = '1111';
var TRANSFERNUM = '1111111111';
var FIRSTNAME = "Jon";
var LASTNAME = "Culver";

app.configure(function(){
    app.use(express.bodyParser());
});

app.post('/', function(req, res){
	// Create a new instance of the TropoWebAPI object.
	var tropo = new tropowebapi.TropoWebAPI();
	from = req.body['session']['from']['id'];
	
	tropo.say("Hi, you have reached "+FIRSTNAME+" "+ LASTNAME +"");
	
	var say = new Say("If you are a recruiter please press 1. Otherwise press 2.");
	var choices = new Choices("1,2");
	
	tropo.ask(choices, 3, false, null, "digit", null, true, say, 5, null);
	// use the on method https://www.tropo.com/docs/webapi/on.htm
	tropo.on("continue", null, "/answer", true);
	
    res.send(tropowebapi.TropoJSON(tropo));
});

app.post('/answer', function(req, res) {
	var tropo = new tropowebapi.TropoWebAPI();
	var response = req.body['result']['actions']['interpretation'];
	
	/* log response */
	var info = new Tracking({ from: from, choice: response });
	info.save(function (err, first) {
			if (err) {
				console.log("error");
			} else {
				console.log("added");
			}
	});
	
	/* if recruiter */
	if(response == RECRUITER) {
		tropo.say(""+FIRSTNAME+"'s email address has been sent via text message.");
		var emailSay = new Say(EMAIL);
		// use the message method https://www.tropo.com/docs/webapi/message.htm
		tropo.message(emailSay, from, null, null, null, "message", "SMS", null, null, null);
		tropo.say("Good bye.");
	} else if(response == OTHER) {
		var say = new Say("Please enter the year "+FIRSTNAME+" was born.");
		var choices = new Choices("[4 DIGITS]");
	
		tropo.ask(choices, 3, false, null, "year", null, true, say, 5, null);
		// use the on method https://www.tropo.com/docs/webapi/on.htm
		tropo.on("continue", null, "/verify", true);
	} else {
		tropo.say("Good Bye.");
	}
	res.send(tropowebapi.TropoJSON(tropo));
});

app.post('/verify', function(req, res) {
	var tropo = new tropowebapi.TropoWebAPI();
	var response = req.body['result']['actions']['interpretation'];
	//console.log(response);
	if(response == BIRTHYEAR) {
		tropo.say("Thank you. Transferring you now, please wait.");
		tropo.transfer(TRANSFERNUM);
	} else {
		tropo.say(""+FIRSTNAME+"'s email address has been sent via text message.");
		var emailSay = new Say(EMAIL);
		// use the message method https://www.tropo.com/docs/webapi/message.htm
		tropo.message(emailSay, from, null, null, null, "message", "SMS", null, null, null);
		tropo.say("Good bye.");
	}
	res.send(tropowebapi.TropoJSON(tropo));
	
});
//for uploading to heroku
var port = process.env.PORT || 8080;
app.listen(port);
console.log('Server running on http://0.0.0.0:'+port+'/')