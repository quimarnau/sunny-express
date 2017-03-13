sunnyExpressApp.factory('SunnyExpress', function ($resource) {
	var departCity, arriveCountry = '';
	var departDate, returnDate = new Date();

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

	this.log = function (message) {
		console.log(message);
	}
	
	return this;
});