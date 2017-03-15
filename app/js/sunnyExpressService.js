sunnyExpressApp.factory('SunnyExpress', function ($resource) {
	var departCity, arriveCountry = '';
	var departDate, returnDate = new Date();
	var minTemperature = 10, maxTemperature = 25;

	this.getDepartCity = function() {
		return departCity;
	}

	this.setDepartCity = function(newDepartCity) {
		departCity = newDepartCity;
	}

	this.getArriveCountry = function() {
		return arriveCountry;
	}

	this.setArriveCountry = function(newArriveCountry) {
		arriveCountry = newArriveCountry;
	}

	this.setMinTemperature = function(temperature) {
		minTemperature = temperature;
	}

	this.getMinTemperature = function() {
		return minTemperature;
	}

	this.setMaxTemperature = function(temperature) {
		maxTemperature = temperature;
	}

	this.getMaxTemperature = function() {
		return maxTemperature;
	}

	this.log = function (message) {
		console.log(message);
	}

	return this;
});