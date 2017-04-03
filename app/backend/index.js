var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

// --- Data --- Normally if the backend is also a crucial element in the app this is in a DB.

var countryCitiesDb = {
		"France": [
		{"name": "Paris", "lon":2.35236,"lat":48.856461},
		{"name": "Marseille", "lon":5.4,"lat":43.299999},
		{"name": "Lyon", "lon":4.83107,"lat":45.7686},
		{"name":"Toulouse","lon":1.44367,"lat":43.604259},
		{"name":"Nice", "lon":7.26608,"lat":43.703129}],
		"Spain": [
		{"name":"Madrid","lon":-3.68275,"lat":40.489349},
		{"name":"Barcelona","lon":2.12804,"lat":41.399422},
		{"name":"Valencia","lon":-0.35457,"lat":39.45612},
		{"name":"Sevilla","lon":-5.97613,"lat":37.382408},
		{"name":"Zaragoza","lon":-0.87734,"lat":41.656059}],
		"Sweden": [
		{"name":"Stockholm","lon":18.064899,"lat":59.332581},
		{"name":"Goeteborg","lon":11.96679,"lat":57.707161},
		{"name":"Malmoe","lon":13.00073,"lat":55.605869},
		{"name":"Uppsala","lon":17.64543,"lat":59.858501},
		{"name":"Sollentuna","lon":17.95093,"lat":59.42804}]};

var baseConditions = [1000, 1006, 1189, 1219];

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

app.get('/trips', function(req, res) {
  	res.json(tripsHistoryDb);
});

app.put('/addTrip', function(req, res) {
	console.log(req.body);
  	res.json({"resp": "OK"});
});

app.delete('/deleteTrip/:id', function(req, res) {
  	res.json({"resp": "OK"});
});
 
app.listen(3000);
