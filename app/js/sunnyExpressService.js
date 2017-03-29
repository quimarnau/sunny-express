sunnyExpressApp.factory("SunnyExpress", function ($resource, $filter, $timeout) {
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

	var weatherApiKey = "8e160eeab587455bb77133238172903";//"4f1d06b1e44e43099b0180536171603";
	var weatherReqUrl = "http://api.apixu.com/v1/forecast.json:forecastParams";

	var googleMapsApiKey = "AIzaSyA9468jXny8bSZUnrtONE3SSh9epY2ctR0";
	var googleMapsReqUrl = "https://maps.googleapis.com/maps/api/geocode/json:locationParams";

	var googlePlacesReqUrl = "https://crossorigin.me/https://maps.googleapis.com/maps/api/place/nearbysearch/json?parameters";

	var googlePhotosReqUrl = "https://maps.googleapis.com/maps/api/place/photo?";

	var baseConditions = [1000, 1006, 1189, 1219]; // Sunny, Cloudy, Moderate rain, Moderate snow
	var weatherConditionResolveDB = {
									1000: [1000,1003],
	 								1006: [1006,1009,1030,1135,1147],
	 								1189: [1063,1087,1150,1153,1183,1186,1189,1192,1195,1198,1201,1240,1243,1246,1273,1276],
	 								1219: [1069,1072,1114,1117,1168,1171,1204,1207,1210,1213,1216,1219,1225,1237,1249,1252,1255,1258,1261,1264,1279,1282]
	 								};
	var tripsHistoryDb = []; // One trip data - {"start": Date(), "end": Date(), "departCity": city, "arriveCity": city}

	var mapFeatures = { center: { latitude: 48.856461, longitude: 2.35236 }, zoom: 5 };


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

	this.getTripForDay = function(checkDate) {
		for (var i = 0; i < tripsHistoryDb.length; i++) {
			if (checkDate.toDateString() === tripsHistoryDb[i].start.toDateString())
				return {
					"data": tripsHistoryDb[i],
					"state": 0
				};
			else if (checkDate.toDateString() === tripsHistoryDb[i].end.toDateString())
				return {
					"data": tripsHistoryDb[i],
					"state": 1
				};
			else if ((checkDate.getTime() <= tripsHistoryDb[i].end.getTime()) && (checkDate.getTime() >= tripsHistoryDb[i].start.getTime()))
				return {
					"data": tripsHistoryDb[i],
					"state": 2
				};
		}
		return null;
	}

	this.addNewTrip = function(trip) {
		tripsHistoryDb.push(trip);
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
		var majorityCondition = {1000: 0, 1006: 0, 1189: 0, 1219: 0};
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

	this.setWeatherActiveCities = function(forecastData) {
		forecastData = filterForecastData(forecastData);

		activeCities = {};
		var temp = [];
		
		for (var i = 0; i < forecastData.length; i++) {
			var weatherState = this.weatherConditionFilter(forecastData[i].forecast.forecastday);
				if(weatherState.state) {
					var name = this.resolveCity(forecastData[i].location.lat,forecastData[i].location.lon);
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

	this.getCountryCities = function() {
		return countryCitiesDb[arriveCountry];
	}

	this.getCountries = function() {
		return Object.keys(countryCitiesDb);
	}

	this.getCities = function() {
		cities = [];
		countries = this.getCountries();

		for (var i = 0; i < countries.length; i++) {
		 	for (var j = 0; j < countryCitiesDb[countries[i]].length; j++) {
		 	 	cities.push(countryCitiesDb[countries[i]][j].name);
		 	 }; 
		};
		return cities.sort();
	}

	this.resolveCity = function(lat, lon) {
		for (var i = 0; i < countryCitiesDb[arriveCountry].length; i++) {
			if((Math.abs(countryCitiesDb[arriveCountry][i].lat - lat) <=0.1) && (Math.abs(countryCitiesDb[arriveCountry][i].lon - lon) <=0.1)) {
				return countryCitiesDb[arriveCountry][i].name;
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

	this.setTouristInfo = function() {
		touristInfo = [];
		selectedCityPhotoSrc = "";
		if (selectedCity != undefined) {
			var latlong = {lat: activeCities[selectedCity].location.latitude , lng: activeCities[selectedCity].location.longitude};

            service = new google.maps.places.PlacesService(new google.maps.Map("",{}));
            service.nearbySearch(
                {location: latlong,
                    radius: 5000
                },
                function(results,status) {
                    $timeout(function () {
                        touristInfo = results.slice(1,6);
                        selectedCityPhotoSrc = results[0].photos[0].getUrl({'maxWidth': 300});
                    })

                });
		}
	};

	this.getTouristInfo = function() {
		return touristInfo;
	};

	this.getPictureSrc = function() {
		return selectedCityPhotoSrc;
	};

	this.setSelectedCity = function(city) {
		selectedCity = city;
	};

	this.getSelectedCity = function() {
		return selectedCity;
	};

	this.getNearbyPlaces = $resource(googlePlacesReqUrl, {parameters: "", key: googleMapsApiKey, location: "@location", radius: "5000"});
	this.getLocationCoordinates = $resource(googleMapsReqUrl, {locationParams: "", key: googleMapsApiKey, address: "@address"});
	this.getCityWeather = $resource(weatherReqUrl, {forecastParams: "", key: weatherApiKey, days: "@days", q: "@q"});

	var countryCitiesDb = {"France": [
		{"name": "Paris", "lon":2.35236,"lat":48.856461},
		{"name": "Marseille", "lon":5.4,"lat":43.299999},
		{"name": "Lyon", "lon":4.83107,"lat":45.7686},
		{"name":"Toulouse","lon":1.44367,"lat":43.604259},
		{"name":"Nice", "lon":7.26608,"lat":43.703129}],
		"Spain": [
		{"name":"Madrid","lon":-3.68275,"lat":40.489349},
		{"name":"Barcelona","lon":2.12804,"lat":41.399422},
		{"name":"Valencia","lon":-0.35457,"lat":39.45612},
		{"name":"Sevilla","lon":-5.97613,"lat":37.382408},
		{"name":"Zaragoza","lon":-0.87734,"lat":41.656059}],
		"Sweden": [
		{"name":"Stockholm","lon":18.064899,"lat":59.332581},
		{"name":"Goeteborg","lon":11.96679,"lat":57.707161},
		{"name":"Malmoe","lon":13.00073,"lat":55.605869},
		{"name":"Uppsala","lon":17.64543,"lat":59.858501},
		{"name":"Sollentuna","lon":17.95093,"lat":59.42804}]};

	return this;
});
