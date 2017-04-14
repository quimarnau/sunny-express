var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var MongoClient = require("mongodb").MongoClient;

var app = express();
app.use(bodyParser.json());
app.use(cors());

var weatherConditionsDbName = "weatherConditionsDb";
var countryCitiesDbName = "countryCitiesDb";
var tripsHistoryDbName = "tripsHistoryDb";
var iataCodesAirlinesDbName = "iataCodesAirlinesDb";

var weatherConditionsDb;
var countryCitiesDb;
var tripsHistoryDb;

var db;

MongoClient.connect("mongodb://root:sunny-express@ds145220.mlab.com:45220/sunny-express", function(err, database) {
	if (err) return console.log(err);
	db = database;

	countryCitiesDb = db.collection(countryCitiesDbName);
	weatherConditionsDb = db.collection(weatherConditionsDbName);
	tripsHistoryDb = db.collection(tripsHistoryDbName);
	iataCodesAirlinesDb = db.collection(iataCodesAirlinesDbName);

	app.listen(3000, function() {
		console.log("Listening on 3000");
	})
})

// ---- Data --- This is in the DB format.

// countryCitiesDb  Format in Db - [{"name": "France", "cities": [
//		{"name": "Paris", "lon":2.35236,"lat":48.856461},
//		{"name": "Marseille", "lon":5.4,"lat":43.299999},
//		{"name": "Lyon", "lon":4.83107,"lat":45.7686},
//		{"name":"Toulouse","lon":1.44367,"lat":43.604259},
//		{"name":"Nice", "lon":7.26608,"lat":43.703129}]}}]


// weatherConditionsDb  Format in DB - [{"baseCode": 1000, "resolveCodes": [1000,1003]}]

// tripsHistoryDb  - Format in DB - [{"id": "1", "trip": {"start": Date(), "end": Date(), "departCity": city, "arriveCity": city, "color": color "forecast": Array, "updateDate": Date(), "arriveCityLat": real,"arriveCityLon": real}},
						//		{"id": 2, "trip": {"start": Date(), "end": Date(), "departCity": city, "arriveCity": city, "color": color, "forecast": Array, "updateDate": Date(), "arriveCityLat": real,"arriveCityLon": real}}]

// iataCodesAirlines = Format in DB         { "iata":"ZY", "name":"Sky Airlines"}


// --- Backend functions available ---

app.get("/countries", function(req, res) {
	countryCitiesDb.find({}).toArray(function(err, docs) {
		var countries = [];
		for (var i = 0; i < docs.length; i++) {
			countries.push(docs[i].name);
		};
		res.json(countries);
	})
});

app.get("/cities", function(req, res) {
	countryCitiesDb.find({}).toArray(function(err, docs) {
		var cities = [];
		for (var i = 0; i < docs.length; i++) {
			for (var j = 0; j < docs[i].cities.length; j++) {
				cities.push(docs[i].cities[j].name);
		 	};
		};
		res.json(cities.sort());
	})
});

app.get("/citiesCountry/:country", function(req, res) {
	countryCitiesDb.find({name:req.params.country}).toArray(function(err, docs) {
		res.json(docs[0].cities);
	})
});

app.get("/baseConditions", function(req, res) {
	weatherConditionsDb.find({}).toArray(function(err, docs) {
		var baseConditions = [];
		for (var i = 0; i < docs.length; i++) {
			baseConditions.push(docs[i].baseCode);
		};
		res.json(baseConditions);
	})
});

app.get("/mapConditionIdName", function(req, res) {
	weatherConditionsDb.find({}).toArray(function(err, docs) {
		var mapConditionIdName = {};
		for (var i = 0; i < docs.length; i++) {
			mapConditionIdName[docs[i].baseCode] = docs[i].name;
		};
		res.json(mapConditionIdName);
	})
});

app.get("/aggregateConditions", function(req, res) {
	weatherConditionsDb.find({}).toArray(function(err, docs) {
		var weatherResolveDb = {};
		for (var i = 0; i < docs.length; i++) {
			weatherResolveDb[docs[i].baseCode] = docs[i].resolveCodes;
		};
		res.json(weatherResolveDb);
	})
});

app.get("/iataCodesAirlines", function(req, res) {
	iataCodesAirlinesDb.find({}).toArray(function(err, docs) {
		var iataCodesAirlines = [];
		for (var i = 0; i < docs.length; i++) {
			iataCodesAirlines.push(docs[i]);
		};
		res.json(iataCodesAirlines);
	})
});

app.get("/trips/:userId", function(req, res) {
	tripsHistoryDb.find({"userId":req.params.userId}).toArray(function(err, docs) {
		var trips = {};
		for (var i = 0; i < docs.length; i++) {
			trips[docs[i].id] = docs[i].trip;
		};
		res.json({"data": trips});
	})
});

app.post("/addTrip/:userId", function(req, res) {
	id = Object.keys(req.body)[0];
	tripsHistoryDb.insert({"id": id,"trip":req.body[id], "userId":req.params.userId}, {w:1}, function(err, result) {
		if(err) console.log(err);
		else if(result.result.ok == 1) {
			res.json({"resp": "OK"});
		}
	});
});

app.post("/updateTrip/:userId/", function(req, res) {
	id = Object.keys(req.body)[0];
	console.log(req.body[id]);
	tripsHistoryDb.update({"id": id, "userId":req.params.userId}, {"id": id,"trip":req.body[id], "userId":req.params.userId}, {w:1}, function(err, result) {
		if(err) console.log(err);
		else if(result.result.ok == 1) {
			res.json({"resp": "OK"});
		}
	});
});

app.delete("/deleteTrip/:userId/:id", function(req, res) {
	tripsHistoryDb.remove({"userId": req.params.userId,"id":req.params.id}, {w:1}, function(err, result) {
		if(err) console.log(err);
		else if(result.result.ok == 1) {
			res.json({"resp": "OK"});
		}
	});
});
