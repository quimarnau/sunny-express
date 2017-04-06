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

	app.listen(3000, function() {
		console.log("Listening on 3000");
	})
})

// ---- Data --- This is in the DB now.

var countryCitiesDb = [{"name": "France", "cities": [
		{"name": "Paris", "lon":2.35236,"lat":48.856461},
		{"name": "Marseille", "lon":5.4,"lat":43.299999},
		{"name": "Lyon", "lon":4.83107,"lat":45.7686},
		{"name":"Toulouse","lon":1.44367,"lat":43.604259},
		{"name":"Nice", "lon":7.26608,"lat":43.703129}]},
		{"name": "Spain", "cities": [
		{"name":"Madrid","lon":-3.68275,"lat":40.489349},
		{"name":"Barcelona","lon":2.12804,"lat":41.399422},
		{"name":"Valencia","lon":-0.35457,"lat":39.45612},
		{"name":"Sevilla","lon":-5.97613,"lat":37.382408},
		{"name":"Zaragoza","lon":-0.87734,"lat":41.656059}]},
		{"name": "Sweden", "cities": [
		{"name":"Stockholm","lon":18.064899,"lat":59.332581},
		{"name":"Goeteborg","lon":11.96679,"lat":57.707161},
		{"name":"Malmoe","lon":13.00073,"lat":55.605869},
		{"name":"Uppsala","lon":17.64543,"lat":59.858501},
		{"name":"Sollentuna","lon":17.95093,"lat":59.42804}]}];


var weatherConditionResolveDB = [{"baseCode": 1000, "resolveCodes": [1000,1003]},
								{"baseCode": 1006, "resolveCodes": [1006,1009,1030,1135,1147]},
								{"baseCode": 1189, "resolveCodes": [1063,1087,1150,1153,1180,1183,1186,1189,1192,1195,1198,1201,1240,1243,1246,1273,1276]},
								{"baseCode": 1219, "resolveCodes": [1069,1072,1114,1117,1168,1171,1204,1207,1210,1213,1216,1219,1225,1237,1249,1252,1255,1258,1261,1264,1279,1282]}];

var tripsHistoryDb = {}; // Format in DB - [{"id": "1", "trip": {"start": Date(), "end": Date(), "departCity": city, "arriveCity": city}},
						//		{"id": 2, "trip": {"start": Date(), "end": Date(), "departCity": city, "arriveCity": city}}]


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

app.get("/aggregateConditions", function(req, res) {
	weatherConditionsDb.find({}).toArray(function(err, docs) {
		var weatherResolveDb = {};
		for (var i = 0; i < docs.length; i++) {
			weatherResolveDb[docs[i].baseCode] = docs[i].resolveCodes;
		};
		res.json(weatherResolveDb);
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
	console.log(req.params.userId);
	tripsHistoryDb.insert({"id": id,"trip":req.body[id], "userId":req.params.userId}, {w:1}, function(err, result) {
		if(err) console.log(err);
		else if(result.result.ok == 1) {
			res.json({"resp": "OK"});
		}
	});
});

app.delete("/deleteTrip/:userId/:id", function(req, res) {
	console.log(req.params.userId);
	tripsHistoryDb.remove({"userId": req.params.userId,"id":req.params.id}, {w:1}, function(err, result) {
		if(err) console.log(err);
		else if(result.result.ok == 1) {
			res.json({"resp": "OK"});
		}
	});
});

