var express = require("express");
var bodyParser = require("body-parser");
var MongoClient = require("mongodb").MongoClient;

var app = express();
app.use(bodyParser.json());

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

var tripsHistoryDb = {};

var getCities = function() {
	cities = [];
	countries = getCountries();

	for (var i = 0; i < countries.length; i++) {
		for (var j = 0; j < countryCitiesDb[countries[i]].length; j++) {
			cities.push(countryCitiesDb[countries[i]][j].name);
		 }; 
	};
	return cities.sort();
}


var getCountryCities = function(country) {
	return countryCitiesDb[country];
}

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
	res.json(getCities());
});

app.get("/citiesCountry/:country", function(req, res) {
	res.json(getCountryCities(req.params.country));
});

app.get("/baseConditions", function(req, res) {
	res.json(baseConditions);
});

app.get("/aggregateConditions", function(req, res) {
	res.json(weatherConditionResolveDB);
});

app.get("/trips", function(req, res) {
	res.json(tripsHistoryDb);
});

app.put("/addTrip", function(req, res) {
	console.log(req.body);
	res.json({"resp": "OK"});
});

app.delete("/deleteTrip/:id", function(req, res) {
	if(req.params.id in tripsHistoryDb) {

	}
	res.json({"resp": "OK"});
});

