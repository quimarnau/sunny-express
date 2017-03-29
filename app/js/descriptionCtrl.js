sunnyExpressApp.controller('DescriptionCtrl', function ($scope, $location, SunnyExpress) {

	// TODO: Move to model, map and description views using it
	$scope.mapConditionIdName = {
		1000: "sunny",
		1006: "cloudy",
		1189: "rain",
		1219: "snow"
	};

    $scope.cityPic = function() {
    	return SunnyExpress.getPictureSrc();
	};

	SunnyExpress.setTouristInfo();

	$scope.getTouristInfo = function() {
	    return SunnyExpress.getTouristInfo().slice(1,6);
    };

    $scope.getDepartCity = function() {
        return SunnyExpress.getDepartCity();
    }

    $scope.getArriveCity = function() {
        return SunnyExpress.getSelectedCity();
    }

    $scope.getCityInfo = function() {
    	return SunnyExpress.getActiveCities()[SunnyExpress.getSelectedCity()];
    }

    $scope.getForecast = function() {
    	var forecast = SunnyExpress.getActiveCities()[SunnyExpress.getSelectedCity()].forecast;
    	var max5dayforecast = [];
    	for (var i = 0; i < Math.min(forecast.length, 5); i++) {
    		max5dayforecast.push(forecast[i]);
	    }
	    return max5dayforecast;
    }

    $scope.getWeatherIcon = function(code) {
		return SunnyExpress.filterCode(code);
    }

    // Still blocking the goto function because of tripsHistoryDb said undefined in console...
    $scope.addTrip = function () {

    	var departDate = SunnyExpress.getDepartDate();
    	var returnDate = SunnyExpress.getReturnDate();
    	var departCity = SunnyExpress.getDepartCity();
    	var returnCity = SunnyExpress.getSelectedCity();

    	var trip = {"start": departDate, "end": returnDate, "departCity": departCity, "arriveCity": returnCity};

    	SunnyExpress.addNewTrip(trip);
    }

    $scope.goToCalendar = function () {
  		$location.path('/calendar');
  	};

});
