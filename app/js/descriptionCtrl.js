sunnyExpressApp.controller('DescriptionCtrl', function ($scope, $location, SunnyExpress) {

	// TODO: Move to model, map and description views using it
	$scope.mapConditionIdName = {
		1000: "sunny",
		1006: "cloudy",
		1189: "rain",
		1219: "snow"
	};

    $scope.cityPic = "images/paris.jpg";

	SunnyExpress.setTouristInfo();

	$scope.getTouristInfo = function() {
	    var touristInfo = SunnyExpress.getTouristInfo();
	    $scope.city = touristInfo[0];
	    $scope.cityPic = SunnyExpress.getPictureSrc();
	    return touristInfo.slice(1,6);
    };

	$scope.selectedCityPhotoSrc = function() {
	    console.log(SunnyExpress.getPictureSrc());
	    return "images/paris.jpg";
        return SunnyExpress.getPictureSrc();
    }

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
