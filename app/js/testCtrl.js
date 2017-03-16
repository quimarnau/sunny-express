sunnyExpressApp.controller('TestCtrl', function($scope, $q, SunnyExpress) {
	
	this.searchCity = function(numDays, city) {
		var d = $q.defer();
		var result = SunnyExpress.getCityWeather.get({days: numDays, q: city}, function() {
			d.resolve(result);
		});

		return d.promise;
	}

	this.search = function() {
		//TODO show loading picture
		return SunnyExpress.responseParis;
		var numDays = Math.round((SunnyExpress.getReturnDate()-SunnyExpress.getDepartDate())/(1000*60*60*24));
		var cities = SunnyExpress.getActiveCities(SunnyExpress.getArriveCountry());
		var cityQueue = [];
		for (var i = 0; i < cities.length; i++) {
			cityQueue.push(this.searchCity(numDays,cities[i]));
		};
		$q.all(cityQueue).then(function(data) {
			//TODO hide loading picture
		})
	}

	this.search();
		
});