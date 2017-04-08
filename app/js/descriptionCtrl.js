sunnyExpressApp.controller("DescriptionCtrl", function ($scope, $location, $rootScope, $timeout, $mdDialog, SunnyExpress) {
	$rootScope.$broadcast("loadingEvent",true);
	$scope.thereAreFlights = false;
	$scope.status = "Loading...";

	var selectedCity = SunnyExpress.getSelectedCity();
	if (selectedCity != undefined) {
		$scope.firstApiFinished = false;
		var activeCities = SunnyExpress.getActiveCities();
		var latlong = {lat: activeCities[selectedCity].location.latitude , lng: activeCities[selectedCity].location.longitude};

		service = new google.maps.places.PlacesService(new google.maps.Map("",{}));
		service.nearbySearch(
			{location: latlong,
				radius: 5000,
				types: ["locality", "museum", "amusement_park", "mosque", "church"]
			},
			function(results,status) {
				$timeout(function () {
					SunnyExpress.setTouristInfo(results.slice(1,10));
					SunnyExpress.setPictureSrc(results[0].photos[0].getUrl({"maxWidth": 300}));
                    $rootScope.$broadcast("loadingEvent", false);
					/*if ($scope.firstApiFinished) {
                        $rootScope.$broadcast("loadingEvent", false);
                    } else {
						$scope.firstApiFinished = true;
					}*/
				})
			});
		SunnyExpress.searchFlights(function(data) {
            $timeout(function() {
                var flightInfo = {};
                flightInfo.quotes = data.Quotes.filter(function(quote) {
                	return quote.InboundLeg != undefined && quote.OutboundLeg != undefined;
				});
                if (flightInfo.quotes.length >= 1) {
                	$scope.thereAreFlights = true;
                    flightInfo.carriers = {};
                    for (var i = 0; i < data.Carriers.length; ++i) {
                    	var iataObj = SunnyExpress.getIataCodesAirlines().filter(function (carrier) {
                            return carrier.name.toLowerCase() == data.Carriers[i].Name.toLowerCase();
                        })[0];
                        flightInfo.carriers[data.Carriers[i].CarrierId] = {
                            name: data.Carriers[i].Name,
                            iata: (iataObj == undefined ? undefined : iataObj.iata),
							imageSrc: iataObj == undefined ? undefined : "http://pics.avs.io/200/200/" + iataObj.iata + ".png"
                        };
                    }
                    flightInfo.currencies = [];
                    for (var i = 0; i < data.Currencies.length; ++i)
                        flightInfo.currencies.push({code: data.Currencies[i].Code, symbol: data.Currencies[i].Symbol});
                    flightInfo.places = {};
                    for (var i = 0; i < data.Places.length; ++i)
                        flightInfo.places[data.Places[i].PlaceId] = data.Places[i];
                    flightInfo.quotes.sort(function (a, b) {
                        return a.MinPrice - b.MinPrice;
                    }).slice(0, 3);
                    console.log(flightInfo);
                    SunnyExpress.setFlights(flightInfo);
                } else {
                	$scope.thereAreFlights = false;
				}
                /*if ($scope.firstApiFinished) {
                    $rootScope.$broadcast("loadingEvent", false);
                } else {
                    $scope.firstApiFinished = true;
                }*/
            })
        },
            function(data) {
                alert('error flight prices');
                console.log(data);
                $scope.status = "Error found";
            });
	}

	// TODO: Move to model, map and description views using it
	$scope.mapConditionIdName = {
		1000: "sunny",
		1006: "cloudy",
		1189: "rain",
		1219: "snow"
	};

    $scope.getQuotes = function() {
        $scope.getFlights = SunnyExpress.getFlights();
        return $scope.getFlights.quotes;
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
		var tripStatus = SunnyExpress.checkTripOverlap(trip);
		if(tripStatus != null) {
			$mdDialog.show(
				$mdDialog.alert()
					.parent(angular.element(document.querySelector("#general-view")))
					.clickOutsideToClose(true)
					.title("ERROR OVERLAPPING TRIPS")
					.textContent("The selected trip is overlapping with an already saved one starting: " + tripStatus.start.toLocaleString("en-us",{month: "long"})
						+ " " + tripStatus.start.getDate() + " ending on: " + tripStatus.end.toLocaleString("en-us",{month: "long"}) + " " + tripStatus.end.getDate()
						+ ". The trip is departing from: " + tripStatus.departCity
						+ " and arriving in: " + tripStatus.arriveCity + ".")
					.ariaLabel("Alert")
					.ok("Got it!")
			);
			return;
		}

		if(SunnyExpress.getIsLoggedIn()) {
			var newId = SunnyExpress.addNewTrip(trip);
			var data = {};
			data[newId] = trip;
			SunnyExpress.backendAddTrip.create({"userId": SunnyExpress.getUserId()},data, function(data){
				if(data.resp != "OK") {
					$mdDialog.show(
						$mdDialog.alert()
							.parent(angular.element(document.querySelector("#general-view")))
							.clickOutsideToClose(true)
							.title("ERROR WHILE SAVING TRIP TO DB")
							.textContent("The trip saving to the DB was unsuccessful due to an error.")
							.ariaLabel("Alert")
							.ok("Got it!")
					);
				}
			});
			$scope.goToCalendar();
		} else {
			var confirm = $mdDialog.confirm()
				.parent(angular.element(document.querySelector("#general-view")))
				.title("WARNING! YOU ARE NOT LOGGED IN")
				.textContent("The trip will not be saved permanently because you are not logged in. Log in to save it.")
				.ariaLabel("Warning")
				.ok("Proceed anyway")
				.cancel("Okay I will log in first");

			$mdDialog.show(confirm).then(function() {
				var newId = SunnyExpress.addNewTrip(trip);
				$scope.goToCalendar();
			}, function() {
			});
		}
	}

	$scope.goToCalendar = function () {
		$location.path("/calendar");
	};

});
