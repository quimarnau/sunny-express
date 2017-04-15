sunnyExpressApp.controller("DescriptionCtrl", function ($scope, $location, $rootScope, $timeout, $mdDialog, $routeParams, cities, countries, baseConditions,
	aggregateConditions, iataCodesAirlines, mapConditionIdName, trips, SunnyExpress) {
	var defaultColor = "white";
	$rootScope.$broadcast("loadingEvent",true);

	if(SunnyExpress.getCities() == undefined) SunnyExpress.setCities(cities) ;
	if(SunnyExpress.getCountries() == undefined) SunnyExpress.setCountries(countries);
	if(SunnyExpress.getBaseConditions() == undefined) SunnyExpress.setBaseConditions(baseConditions);
	if(SunnyExpress.getAggregateConditions() == undefined) SunnyExpress.setAggregateConditions(aggregateConditions);
	if(SunnyExpress.getIataCodesAirlines() == undefined) SunnyExpress.setIataCodesAirlines(iataCodesAirlines);
	if(SunnyExpress.getMapConditionIdName() == undefined) SunnyExpress.setMapConditionIdName(mapConditionIdName);
	if((SunnyExpress.getIsLoggedIn()) && (Object.keys(SunnyExpress.getTrips()).length == 0)) SunnyExpress.setTrips(trips);

	$scope.thereAreFlights = false;
	$scope.status = "Loading...";	
	$scope.mapConditionIdName = SunnyExpress.getMapConditionIdName();

	var selectedCity = undefined;
	var activeCities = undefined;

	var init = function() {
		selectedCity = SunnyExpress.getSelectedCity();
		// There was a reload, weather search again.
		if(selectedCity == undefined) {
			selectedCity = $routeParams.cityName
			SunnyExpress.setSelectedCity(selectedCity);
			SunnyExpress.searchWeather(function() {
				$rootScope.searchPerformed = true;
				initContent();
			});
		} else {
			initContent();
		}
	}

	var initContent = function() {
		activeCities = SunnyExpress.getActiveCities();
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
				})
			});

		SunnyExpress.searchFlights(function(data) {
			$timeout(function() { 
				var flightInfo = {};
				flightInfo.quotes = data.Quotes.filter(function(quote) {
					return quote.InboundLeg != undefined && quote.OutboundLeg != undefined;
				});

				var inbounds = data.Quotes.filter(function(quote) {
					return quote.InboundLeg != undefined && quote.OutboundLeg == undefined;
				});
				data.Quotes.forEach(function(quoteOut, index) {
					if(quoteOut.InboundLeg == undefined && quoteOut.OutboundLeg != undefined) {
						inbounds.forEach(function(quoteIn, index) {
							var q = angular.copy(quoteOut);
							q.MinPrice += quoteIn.MinPrice;
							q.InboundLeg = quoteIn.InboundLeg;
							flightInfo.quotes.push(q);
						});
					}
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
					SunnyExpress.setFlights(flightInfo);
				} else {
					$scope.thereAreFlights = false;
					$scope.status = "There are no available flights for the selected dates and cities.";
				}
			})
		},
			function(data) { 
				console.log(data);
				$scope.status = "Error found";
				$mdDialog.show(
					$mdDialog.alert()
						.parent(angular.element(document.querySelector("#general-view")))
						.clickOutsideToClose(true)
						.title("ERROR SEARCHING FOR FLIGHTS")
						.textContent("There has been an error searching for a suitable flight. Most possibly there is no airport in one of the cities.")
						.ariaLabel("Alert")
						.ok("Got it!")
				);
			});
	}

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
		if(SunnyExpress.getActiveCities()[SunnyExpress.getSelectedCity()] == undefined) return;
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
		var forecasts = SunnyExpress.getActiveCities()[SunnyExpress.getSelectedCity()].forecast;
		var aggregatedForecast = [];
		var tempDate = new Date(departDate);

		for(dayForecast in forecasts) {
			aggregatedForecast.push({"date": new Date(tempDate), "condition": SunnyExpress.filterCode(forecasts[dayForecast].day.condition.code)});
			tempDate.setDate(tempDate.getDate() + 1);
			tempDate = new Date(tempDate);
		}

		var trip = {"start": departDate, "end": returnDate, "departCity": departCity, "arriveCity": returnCity, "color": defaultColor, 
		"forecast": aggregatedForecast, "updateDate": new Date(), "arriveCityLat": activeCities[selectedCity].location.latitude, "arriveCityLon": activeCities[selectedCity].location.longitude};

		if(SunnyExpress.getIsLoggedIn()) {
			if(Object.keys(SunnyExpress.getTrips()).length == 0) {
				$rootScope.$broadcast("loadingEvent",true);
				SunnyExpress.backendGetTrips.get({"userId": SunnyExpress.getUserId()},function(data) {
					$rootScope.$broadcast("loadingEvent",false);
					for(tripId in data.data) {
						data.data[tripId].start = new Date(data.data[tripId].start);
						data.data[tripId].end = new Date(data.data[tripId].end);
						data.data[tripId].updateDate = new Date(data.data[tripId].updateDate);
					}
					SunnyExpress.setTrips(data.data);
					if(checkOverlap(trip)) {
						return;
					} else {
						addTrip(trip);
						$scope.goToCalendar();
					}
				})
			} else {
				if(checkOverlap(trip)) {
						return;
				} else {
					addTrip(trip);
					$scope.goToCalendar();
				}
			}
		} else {
			var confirm = $mdDialog.confirm()
				.parent(angular.element(document.querySelector("#general-view")))
				.title("WARNING! YOU ARE NOT LOGGED IN")
				.textContent("The trip will not be saved permanently because you are not logged in. Log in to save it.")
				.ariaLabel("Warning")
				.ok("Proceed anyway")
				.cancel("Okay I will log in first");

			$mdDialog.show(confirm).then(function() {
				if(checkOverlap(trip)) {
						return;
					} else {
						SunnyExpress.addNewTrip(trip);
						$scope.goToCalendar();
					}
			}, function() {
			});
		}
	}

	var checkOverlap = function(trip) {
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
			return true;
		}
		return false;
	}

	var addTrip = function(trip) {
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
	}

	$scope.goToCalendar = function () {
		$location.path("/calendar");
	};

	init();

});
