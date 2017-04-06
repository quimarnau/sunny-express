sunnyExpressApp.controller('DescriptionCtrl', function ($scope, $location, $rootScope, $timeout, $mdDialog, SunnyExpress) {
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
					SunnyExpress.setTouristInfo(results.slice(1,10));
					SunnyExpress.setPictureSrc(results[0].photos[0].getUrl({'maxWidth': 300}));
					$rootScope.$broadcast("loadingEvent",false);
				})
			});
	}

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

		var newId = SunnyExpress.addNewTrip(trip);
		if(SunnyExpress.getIsLoggedIn()) {
			var data = {};
			data[newId] = trip;
			SunnyExpress.backendAddTrip.create({"userId": SunnyExpress.getUserId()},data, function(data){
				if(data.resp != "OK") {
					$mdDialog.show(
						$mdDialog.alert()
							.parent(angular.element(document.querySelector('#general-view')))
							.clickOutsideToClose(true)
							.title('ERROR WHILE SAVING TRIP TO DB')
							.textContent('The trip saving to the DB was unsuccessful due to an error.')
							.ariaLabel('Alert')
							.ok('Got it!')
					);
				}
			});
			$scope.goToCalendar();
		} else {
			var confirm = $mdDialog.confirm()
				.parent(angular.element(document.querySelector('#general-view')))
				.title('WARNING! YOU ARE NOT LOGGED IN')
				.textContent('The trip will not be saved permanently because you are not logged in. Log in to save it.')
				.ariaLabel('Warning')
				.ok('Proceed anyway')
				.cancel('Okay I will log in first');

			$mdDialog.show(confirm).then(function() {
				$scope.goToCalendar();
			}, function() {
			});
		}
	}

	$scope.goToCalendar = function () {
		$location.path('/calendar');
	};

});
