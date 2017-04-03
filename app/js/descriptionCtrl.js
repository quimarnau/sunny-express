sunnyExpressApp.controller('DescriptionCtrl', function ($scope, $location, $rootScope, $timeout,SunnyExpress) {

	$(function() {
        $rootScope.$broadcast("loadingEvent",true);
        var selectedCity = SunnyExpress.getSelectedCity();
        if (selectedCity != undefined) {
            var activeCities = SunnyExpress.getActiveCities();
            var latlong = {lat: activeCities[selectedCity].location.latitude , lng: activeCities[selectedCity].location.longitude};

            service = new google.maps.places.PlacesService(new google.maps.Map("",{}));
            service.nearbySearch(
                {location: latlong,
                    radius: 5000,
                    types: ['locality', 'museum', 'amusement_park', 'mosque', 'church']
                },
                function(results,status) {
                    $timeout(function () {
                        console.log(results);
                        SunnyExpress.setTouristInfo(results.slice(1,10));
                        SunnyExpress.setPictureSrc(results[0].photos[0].getUrl({'maxWidth': 300}));
                        $rootScope.$broadcast("loadingEvent",false);
                    })
                });
        }
    });

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


	$scope.getTouristInfo = function() {
	    return SunnyExpress.getTouristInfo();
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
