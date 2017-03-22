sunnyExpressApp.controller('HomeCtrl', function($scope, $q, SunnyExpress) {
	
	this.searchWeatherCity = function(numDays, city) {
		var d = $q.defer();
		var result = SunnyExpress.getCityWeather.get({days: numDays, q: city}, function() {
			d.resolve(result);
		});

		return d.promise;
	}

	this.searchWeather = function() {
		//TODO show loading picture
		return SunnyExpress.responseParis;
		
		var numDays = Math.round((SunnyExpress.getReturnDate()-SunnyExpress.getDepartDate())/(1000*60*60*24));
		var cities = SunnyExpress.getCountryCities(SunnyExpress.getArriveCountry());
		var cityQueue = [];

		for (var i = 0; i < cities.length; i++) {
			cityQueue.push(this.searchWeatherCity(numDays,cities[i].name));
		};

		$q.all(cityQueue).then(function(data) {
			for (var i = 0; i < data.length; i++) {
				if (SunnyExpress.weatherConditionFilter(data[i].forecast.forecastday)) {
					console.log(data.location.name); // It is good for the weather preference
				};
			};

		})
	}
	var favourableWeatherConditions = [1189];
	var disfavourableWeatherConditions = [1006];

	SunnyExpress.setFavourableWeatherConditions(favourableWeatherConditions);
	SunnyExpress.setDisfavourableWeatherConditions(disfavourableWeatherConditions);
	console.log(SunnyExpress.weatherConditionFilter(SunnyExpress.responseParis.forecast.forecastday));
	this.searchWeather();
		
});