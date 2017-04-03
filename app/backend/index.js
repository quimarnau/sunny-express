var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

var app = express();
app.use(bodyParser.json());

var db;

MongoClient.connect('mongodb://root:sunny-express@ds145220.mlab.com:45220/sunny-express', function(err, database) {
	if (err) return console.log(err);
	db = database;

	/* Only comment out if you want to load new data into the DB. These data already there!
	var countriesDb = db.collection('countryCitiesDb');
	for (country in countryCitiesDb) {
		countriesDb.insert({country:countryCitiesDb[country]});
	};*/

	/* Only comment out if you want to load new data into the DB. These data already there!
	var conditionsDb = db.collection('weatherConditionsDb');
	for (code in weatherConditionResolveDB) {
		conditionsDb.insert({code:weatherConditionResolveDB[code]});
	}*/

	app.listen(3000, function() {
		console.log('Listening on 3000');
	})
})


var baseConditions = [1000, 1006, 1189, 1219];

var weatherConditionResolveDB = {
									1000: [1000,1003],
									1006: [1006,1009,1030,1135,1147],
									1189: [1063,1087,1150,1153,1180,1183,1186,1189,1192,1195,1198,1201,1240,1243,1246,1273,1276],
									1219: [1069,1072,1114,1117,1168,1171,1204,1207,1210,1213,1216,1219,1225,1237,1249,1252,1255,1258,1261,1264,1279,1282]
									};

var tripsHistoryDb = {};

// --- Helper functions ---

var getCountries = function() {
	return Object.keys(countryCitiesDb);
};

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

app.get('/countries', function(req, res) {
	res.json(getCountries());
});

app.get('/cities', function(req, res) {
	res.json(getCities());
});

app.get('/citiesCountry/:country', function(req, res) {
	res.json(getCountryCities(req.params.country));
});

app.get('/baseConditions', function(req, res) {
	res.json(baseConditions);
});

app.get('/aggregateConditions', function(req, res) {
	res.json(weatherConditionResolveDB);
});

app.get('/trips', function(req, res) {
	res.json(tripsHistoryDb);
});

app.put('/addTrip', function(req, res) {
	console.log(req.body);
	res.json({"resp": "OK"});
});

app.delete('/deleteTrip/:id', function(req, res) {
	if(req.params.id in tripsHistoryDb) {

	}
	res.json({"resp": "OK"});
});

