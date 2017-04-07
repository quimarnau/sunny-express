sunnyExpressApp.factory("SunnyExpress", function ($resource, $filter, $timeout, $q) {
	var windThreshold = "40"; // kmh

	var departCity, arriveCountry = undefined;
	var departDate, returnDate = undefined;
	var minTemperature = -10, maxTemperature = 30;
	var favourableWeatherConditions = [];
	var disfavourableWeatherConditions = [];
	var windPreference = 0; // -1 - slow wind,0 - dont care, 1 - strong wind
	var activeCities = {};
	var iconsState = [0, 0, 0, 0];
	var selectedCity = undefined;
	var touristInfo = [];
	var selectedCityPhotoSrc = undefined;
	var dayOffset = 0;
	var userId = undefined; // Userid from login
	var isLoggedIn = false; // set this flag to true if logged in
	var flightInfo = {};

	var weatherApiKey = "8e160eeab587455bb77133238172903";//"4f1d06b1e44e43099b0180536171603";
	var weatherReqUrl = "http://api.apixu.com/v1/forecast.json:forecastParams";

	var googleMapsApiKey = "AIzaSyA9468jXny8bSZUnrtONE3SSh9epY2ctR0";
	var googleMapsReqUrl = "https://maps.googleapis.com/maps/api/geocode/json:locationParams";

	var googlePlacesReqUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?parameters";

	var googlePhotosReqUrl = "https://maps.googleapis.com/maps/api/place/photo?";

    var skyscannerAPI = "https://crossorigin.me/http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/:country/:currency/en-US/:depart/:arrive/anytime/anytime";

	var backendBaseUrl = "http://localhost:3000/";

	var cities = undefined;
	var countries = undefined;

	var baseConditions = undefined;
	var weatherConditionResolveDB = undefined;

	var tripsHistoryDb = {}; // One trip data - 1: {"start": Date(), "end": Date(), "departCity": city, "arriveCity": city}

	var mapFeatures = { center: { latitude: 48.856461, longitude: 2.35236 }, zoom: 5 };

	// User preferences concerning the claedar view, to be moved to the back end
	var forecastDisplay = true;
	var colorEvent = "white"; // background color: white, blue, green, purple, red

	this.setUserId = function(id) {
		userId = id;
	};

	this.getUserId = function() {
		return userId;
	};

	this.setIsLoggedIn = function(flag) {
		isLoggedIn = flag;
	};

	this.getIsLoggedIn = function() {
		return isLoggedIn;
	};

	this.setForecastDisplay = function(state) {
		forecastDisplay = state;
	};

	this.getForecastDisplay = function() {
		return forecastDisplay;
	};


	this.filterCode = function (code) {
		for (var i in weatherConditionResolveDB) {
			if (weatherConditionResolveDB[i].indexOf(code) >= 0)
				return i;
		}
		return null;
	}

	this.setWindPreference = function(windState) {
		this.windPreference = windState;
	}

	this.getWindPreference = function() {
		return this.windPreference;
	}

	this.getTrips = function() {
		return tripsHistoryDb;
	}

	this.setTrips = function(trips) {
		tripsHistoryDb = trips;
	}

	this.checkTripOverlap = function(trip) {
		var d = new Date();
  		d.setTime(trip.start.getTime());

  		while (d.getTime() <= trip.end.getTime()) {
  			var tripStatus = this.getTripForDay(d);
  			if(tripStatus != null) {
  				return tripStatus.data;
  			}
  			d.setDate(d.getDate() + 1);	
  		}
  		return null;
	}

	this.getTripForDay = function(checkDate) {
		for (tripId in tripsHistoryDb) {
			if (checkDate.toDateString() === tripsHistoryDb[tripId].start.toDateString())
				return {
					"data": tripsHistoryDb[tripId],
					"state": 0
				};
			else if (checkDate.toDateString() === tripsHistoryDb[tripId].end.toDateString())
				return {
					"data": tripsHistoryDb[tripId],
					"state": 1
				};
			else if ((checkDate.getTime() <= tripsHistoryDb[tripId].end.getTime()) && (checkDate.getTime() >= tripsHistoryDb[tripId].start.getTime()))
				return {
					"data": tripsHistoryDb[tripId],
					"state": 2
				};
		}
		return null;
	}
	
	this.removeTrip = function(id) {
		delete tripsHistoryDb[id];
	}

	this.addNewTrip = function(trip) {
		var newId = Object.keys(tripsHistoryDb).length != 0 ? Math.max.apply(Math,Object.keys(tripsHistoryDb)) + 1 : 0;
		tripsHistoryDb[newId] = trip;
		return newId;
	}

	this.resolveWeatherCondition = function(id, idToCheck) {
		if(weatherConditionResolveDB[id].indexOf(idToCheck) >= 0) {
			return true;		
		}
		else {
			return false;		
		}
	}

	this.getMajorityCondition = function(weatherForecast) {
		var majorityCondition = {};
		for	(var i = 0; i < baseConditions.length; i++) {
			majorityCondition[baseConditions[i]] = 0;
		}

		for (var i = 0; i < weatherForecast.length; i++) {
			for (var j = 0; j < baseConditions.length; j++) {
			 	if(weatherConditionResolveDB[baseConditions[j]].indexOf(weatherForecast[i].day.condition.code) >= 0) {
			 		majorityCondition[baseConditions[j]]++;
			 	}
			};
		}

		var majorityId = 0;
		var majorityNum = 0; 

		for (var i = 0; i < baseConditions.length; i++) {
			if(majorityCondition[baseConditions[i]] > majorityNum){
				majorityNum = majorityCondition[baseConditions[i]];
				majorityId = baseConditions[i];
			}
		};

		return majorityId;
	}

    /* return 0 if day is dont care, -1 if disfavourable, 1 is favourable*/
	this.dayWeatherConditionFilter = function(dayForecast) {
		var windOk = ((windPreference == -1 && dayForecast.maxwind_kph < windThreshold) || 
						(windPreference == 1 && dayForecast.maxwind_kph > windThreshold) ||
						(windPreference == 0)) ? true : false;

		if (!windOk) {
			return 0;
		}

		if((disfavourableWeatherConditions.length == 0) && (favourableWeatherConditions.length == 0)) {
			return 1;
		}

		if(disfavourableWeatherConditions.length == 0) {
			for (var j = 0; j < favourableWeatherConditions.length; j++) {
				if(this.resolveWeatherCondition(favourableWeatherConditions[j],dayForecast.condition.code)) {					
					return 1;
				}
			}
			return 0;
		}

		if(favourableWeatherConditions.length == 0) {
			for (var j = 0; j < disfavourableWeatherConditions.length; j++) {
				if(this.resolveWeatherCondition(disfavourableWeatherConditions[j],dayForecast.condition.code)) {					
					return -1;
				}
			}
			return 1;
		}

		var dayOk = undefined;
		for (var j = 0; j < favourableWeatherConditions.length; j++) {
			if(this.resolveWeatherCondition(favourableWeatherConditions[j],dayForecast.condition.code)) {					
				dayOk = true;
			}
		};
		for (var j = 0; j < disfavourableWeatherConditions.length; j++) {	
			if (this.resolveWeatherCondition(disfavourableWeatherConditions[j],dayForecast.condition.code)) {
				dayOk = false;
			};
		};

		switch(dayOk) {
			case undefined: return 0;
			case true: return 1;
			case false: return -1;
		}

		return 0;
	}

	this.weatherConditionFilter = function(weatherForecast) {
		var favourableDaysNum = 0;
		var disfavourableDaysNum = 0;
		var intervalLength = weatherForecast.length;
		var maxAverage = 0;
		var minAverage = 0;

		for (var i = 0; i < weatherForecast.length; i++) {
			maxAverage += weatherForecast[i].day.maxtemp_c;
			minAverage += weatherForecast[i].day.mintemp_c;

			var dayResult = this.dayWeatherConditionFilter(weatherForecast[i].day);
			switch(dayResult) {
				case 0 : break;
				case 1 : favourableDaysNum++; break;
				case -1 : disfavourableDaysNum++; break;
			}

		};

		maxAverage = maxAverage / intervalLength;
		minAverage = minAverage / intervalLength;

		if((favourableDaysNum > (intervalLength/2)) && disfavourableDaysNum == 0 && maxAverage < maxTemperature && minAverage > minTemperature) {
			return {"state": true, "majorityCondition": this.getMajorityCondition(weatherForecast), "forecast":weatherForecast};
		} else {
			return {"state": false, "majorityCondition":0, "forecast": []};
		}
	}

	var filterForecastData = function(forecast) {
		for (var i = 0; i < forecast.length; i++) {
			forecast[i].forecast.forecastday.splice(0, dayOffset);
		}
		return forecast;
	}

	this.setWeatherActiveCities = function(forecastData, cities) {
		forecastData = filterForecastData(forecastData);

		activeCities = {};
		var temp = [];
		
		for (var i = 0; i < forecastData.length; i++) {
			var weatherState = this.weatherConditionFilter(forecastData[i].forecast.forecastday);
				if(weatherState.state) {
					var name = this.resolveCity(forecastData[i].location.lat,forecastData[i].location.lon, cities);
                    activeCities[name] = {"name": name, location: {"latitude":forecastData[i].location.lat, "longitude": forecastData[i].location.lon}, "majorityCondition": weatherState.majorityCondition, "forecast": weatherState.forecast};

                    //defining maxtemp and mintemp of the total extent of days
                    var maxTemp = undefined;
                    var minTemp = undefined;
                    for (var j = 0;  j < activeCities[name].forecast.length; ++j) {
                        if (minTemp == undefined || activeCities[name].forecast[j].day.mintemp_c < minTemp)
                            minTemp = activeCities[name].forecast[j].day.mintemp_c;
                        if (maxTemp == undefined || activeCities[name].forecast[j].day.maxtemp_c > maxTemp)
                            maxTemp = activeCities[name].forecast[j].day.maxtemp_c;
                    }
                    activeCities[name].maxtemp = maxTemp;
                    activeCities[name].mintemp = minTemp;
				};
		};
		
	}

	this.setDayOffset = function(offset) {
		dayOffset = offset;
	}

	this.getDayOffset = function() {
		return dayOffset;
	}

	this.setFavourableWeatherConditions = function(weatherConditionsList) {
		favourableWeatherConditions = weatherConditionsList;
	}

	this.getFavourableWeatherConditions = function() {
		return favourableWeatherConditions;
	}

	this.setDisfavourableWeatherConditions = function(weatherConditionsList) {
		disfavourableWeatherConditions = weatherConditionsList;
	};

	this.getDisfavourableWeatherConditions = function() {
		return disfavourableWeatherConditions;
	}

	this.getBaseConditions = function() {
		return baseConditions;
	}

	this.getIconsState = function() {
		return iconsState;
	}

	this.setIconsState = function(state) {
		iconsState = state;
	}

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

	this.setReturnDate = function(date) {
		returnDate = date;
	}

	this.getReturnDate = function() {
		return returnDate;
	}

	this.setDepartDate = function(date) {
		departDate = date;
	}

	this.getDepartDate = function() {
		return departDate;
	}

	this.getCountries = function() {
		return countries;
	}

	this.setCountries = function(data) {
		countries = data;
	}

	this.getCities = function() {
		return cities;
	}

	this.setCities = function(data) {
		cities = data;
	}

	this.resolveCity = function(lat, lon, cities) {
		for (var i = 0; i < cities.length; i++) {
			if((Math.abs(cities[i].lat - lat) <=0.1) && (Math.abs(cities[i].lon - lon) <=0.1)) {
				return cities[i].name;
			}
		};
	}

	this.getActiveCities = function() {
		return activeCities;
	}

	this.setActiveCities = function(cities) {
		activeCities = cities;
	}

    this.setMapFeatures = function (featureName, feature) {
        mapFeatures[featureName] = feature;
    };

    this.getMapFeatures = function () {
        return mapFeatures;
    };


	this.setMapCenter = function() {
		if (arriveCountry != "") {
			this.getLocationCoordinates.get({address: arriveCountry}, function(data) {
				mapFeatures['center'] = {latitude: data.results[0].geometry.location, longitude: data.results[0].geometry.location};
				mapFeatures['zoom'] = 5;
			},
			function(data) {
				alert('error geocode api, searching for ' + arriveCountry);
				console.log(data);
			});
		}
	};

	this.setTouristInfo = function(data) {
		touristInfo = data;
	}

	this.getTouristInfo = function() {
		return touristInfo;
	};

	this.setFlights = function () {
        this.getFlightPrices.get({depart: departCity.slice(0,4), arrive: selectedCity.slice(0,4)}, function(data) {
        	$timeout(function() {
                flightInfo = {};
                flightInfo.quotes = data.Quotes.slice(0,3);
                flightInfo.carriers = {};
                for (var i = 0; i < data.Carriers.length; ++i)
                    flightInfo.carriers[data.Carriers[i].CarrierId] = {name: data.Carriers[i].Name};
                flightInfo.currencies = [];
                for (var i = 0; i < data.Currencies.length; ++i)
                    flightInfo.currencies.push({code: data.Currencies[i].Code, symbol: data.Currencies[i].Symbol});
                flightInfo.places = {};
                for (var i = 0; i < data.Places.length; ++i)
                    flightInfo.places[data.Places[i].PlaceId] = data.Places[i];
                flightInfo.quotes.sort(function(a,b) {return a.MinPrice-b.MinPrice;});
                console.log(flightInfo);
            })
            },
            function(data) {
                alert('error flight prices');
                console.log(data);
            });
	};

	this.getFlights = function () {
		return flightInfo;
	};

	this.setPictureSrc = function(pictureSrc) {
		selectedCityPhotoSrc = pictureSrc;
	}

	this.getPictureSrc = function() {
		return selectedCityPhotoSrc;
	};

	this.setSelectedCity = function(city) {
		selectedCity = city;
	};

	this.getSelectedCity = function() {
		return selectedCity;
	};

	this.getColorEvent = function () {
		return colorEvent;
	}

	this.setColorEvent = function(color) {
		colorEvent = color;
	}

	this.setBaseConditions = function(data) {
		baseConditions = data;
	}

	this.getBaseConditions = function(data) {
		return baseConditions;
	}

	this.setAggregateConditions = function(data) {
		weatherConditionResolveDB = data;
	}

	this.getAggregateConditions = function(data) {
		return weatherConditionResolveDB;
	}

	this.getNearbyPlaces = $resource(googlePlacesReqUrl, {parameters: "", key: googleMapsApiKey, location: "@location", radius: "5000"});
	this.getLocationCoordinates = $resource(googleMapsReqUrl, {locationParams: "", key: googleMapsApiKey, address: "@address"});
	this.getCityWeather = $resource(weatherReqUrl, {forecastParams: "", key: weatherApiKey, days: "@days", q: "@q"});
    this.getFlightPrices = $resource(skyscannerAPI, {country: "es", currency: "eur", depart: "@depart", arrive: "@arrive", apiKey: "su432392509767429345513163956199"});

	this.backendGetCountries = $resource(backendBaseUrl+"countries");
	this.backendGetCities = $resource(backendBaseUrl+"cities");
	this.backendGetBaseConditions = $resource(backendBaseUrl+"baseConditions");
	this.backendGetAggregateConditions = $resource(backendBaseUrl+"aggregateConditions");
	this.backendGetCitiesCountry = $resource(backendBaseUrl+"citiesCountry/:country");
	this.backendGetTrips = $resource(backendBaseUrl+"trips/:userId");
	this.backendAddTrip = $resource(backendBaseUrl+"addTrip/:userId",{}, { create: { method: "POST", headers: { "Content-Type": "application/json"}}});
	this.backendRemoveTrip = $resource(backendBaseUrl+"deleteTrip/:userId/:id");

	return this;
});
