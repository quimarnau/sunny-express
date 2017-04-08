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

    var skyscannerAPI = "https://crossorigin.me/http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/:country/:currency/en-US/:depart/:arrive/:departureDate/:arriveDate";

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

	this.date2yyyymmdd = function (date) {
        var yyyy = date.getFullYear();
        var mm = date.getMonth() + 1;
        var dd = date.getDate();
        return yyyy.toString() + '-' + (mm < 10 ? '0' : '') + mm.toString() + '-' + (dd < 10 ? '0' : '') + dd.toString();
    };

	this.searchFlights = function (successCallback, errorCallback) {
        var departDate = this.date2yyyymmdd(this.getDepartDate());
        //console.log(departDate);
        var arriveDate = this.date2yyyymmdd(this.getReturnDate());
        //console.log(arriveDate);
        this.getFlightPrices.get({depart: departCity.slice(0,4), arrive: selectedCity.slice(0,4), departureDate: departDate, arriveDate: arriveDate}, successCallback,errorCallback);
	};

	this.setFlights = function(data) {
		flightInfo = data;
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

	this.getIataCodesAirlines = function() {
		return this.iataCodesAirlines;
	};


	this.getNearbyPlaces = $resource(googlePlacesReqUrl, {parameters: "", key: googleMapsApiKey, location: "@location", radius: "5000"});
	this.getLocationCoordinates = $resource(googleMapsReqUrl, {locationParams: "", key: googleMapsApiKey, address: "@address"});
	this.getCityWeather = $resource(weatherReqUrl, {forecastParams: "", key: weatherApiKey, days: "@days", q: "@q"});
    this.getFlightPrices = $resource(skyscannerAPI, {country: "es", currency: "eur", depart: "@depart", arrive: "@arrive", departureDate: "@departureDate", arriveDate: "@arriveDate", apiKey: "su432392509767429345513163956199"});

	this.backendGetCountries = $resource(backendBaseUrl+"countries");
	this.backendGetCities = $resource(backendBaseUrl+"cities");
	this.backendGetBaseConditions = $resource(backendBaseUrl+"baseConditions");
	this.backendGetAggregateConditions = $resource(backendBaseUrl+"aggregateConditions");
	this.backendGetCitiesCountry = $resource(backendBaseUrl+"citiesCountry/:country");
	this.backendGetTrips = $resource(backendBaseUrl+"trips/:userId");
	this.backendAddTrip = $resource(backendBaseUrl+"addTrip/:userId",{}, { create: { method: "POST", headers: { "Content-Type": "application/json"}}});
	this.backendRemoveTrip = $resource(backendBaseUrl+"deleteTrip/:userId/:id");

	this.iataCodesAirlines = [
        {
            "iata":"0A",
            "name":"Amber Air"
        },
        {
            "iata":"0B",
            "name":"Blue Air"
        },
        {
            "iata":"0D",
            "name":"Darwin Airline"
        },
        {
            "iata":"2B",
            "name":"Aerocondor"
        },
        {
            "iata":"2C",
            "name":"SNCF"
        },
        {
            "iata":"2E",
            "name":"Smokey Bay Air"
        },
        {
            "iata":"2I",
            "name":"Star Peru"
        },
        {
            "iata":"2J",
            "name":"Air Burkina"
        },
        {
            "iata":"2K",
            "name":"Aerolineas Galapagos"
        },
        {
            "iata":"2L",
            "name":"Helvetic Airways"
        },
        {
            "iata":"2M",
            "name":"Moldavian Airlines"
        },
        {
            "iata":"2N",
            "name":"Nextjet"
        },
        {
            "iata":"2O",
            "name":"Island Air Service"
        },
        {
            "iata":"2P",
            "name":"Air Philippines"
        },
        {
            "iata":"2Q",
            "name":"Avitrans Nordic"
        },
        {
            "iata":"2U",
            "name":"Sun dOr International Air"
        },
        {
            "iata":"2W",
            "name":"Welcome Air"
        },
        {
            "iata":"2Y",
            "name":"Air Andaman"
        },
        {
            "iata":"2Z",
            "name":"TTA"
        },
        {
            "iata":"3B",
            "name":"Job Air"
        },
        {
            "iata":"3C",
            "name":"Regionsair"
        },
        {
            "iata":"3E",
            "name":"Multi-Aero, Inc. d/b/a Air Choice One"
        },
        {
            "iata":"3F",
            "name":"Pacific Airways Inc"
        },
        {
            "iata":"3H",
            "name":"Air Inuit"
        },
        {
            "iata":"3I",
            "name":"Aerolineas Del Sur"
        },
        {
            "iata":"3K",
            "name":"Jetstar Asia"
        },
        {
            "iata":"3L",
            "name":"Intersky Luftfahrt"
        },
        {
            "iata":"3M",
            "name":"Gulfstream"
        },
        {
            "iata":"3O",
            "name":"Air Arabia Maroc"
        },
        {
            "iata":"3P",
            "name":"Tiara Air Aruba"
        },
        {
            "iata":"3R",
            "name":"Gromov Airline"
        },
        {
            "iata":"3S",
            "name":"Air Antilles Express"
        },
        {
            "iata":"3T",
            "name":"Turan Air"
        },
        {
            "iata":"3U",
            "name":"Sichuan Airlines"
        },
        {
            "iata":"3W",
            "name":"EuroManx"
        },
        {
            "iata":"3Y",
            "name":"Kartika Airlines"
        },
        {
            "iata":"3Z",
            "name":"Everts Air"
        },
        {
            "iata":"3�",
            "name":"Moskovia airlines"
        },
        {
            "iata":"4C",
            "name":"Aires"
        },
        {
            "iata":"4D",
            "name":"Air Sinai"
        },
        {
            "iata":"4E",
            "name":"Tanana Air Service"
        },
        {
            "iata":"4G",
            "name":"Gazprom Avia"
        },
        {
            "iata":"4H",
            "name":"United Airways Bangladesh"
        },
        {
            "iata":"4J",
            "name":"Somon Air"
        },
        {
            "iata":"4K",
            "name":"Kenn Borek Air"
        },
        {
            "iata":"4L",
            "name":"Euroline"
        },
        {
            "iata":"4M",
            "name":"LAN Argentina"
        },
        {
            "iata":"4N",
            "name":"Air North"
        },
        {
            "iata":"4O",
            "name":"Interjet"
        },
        {
            "iata":"4Q",
            "name":"Safi Airways"
        },
        {
            "iata":"4R",
            "name":"Hamburg International"
        },
        {
            "iata":"4T",
            "name":"Belair Airlines"
        },
        {
            "iata":"4U",
            "name":"Germanwings"
        },
        {
            "iata":"4V",
            "name":"Lignes Aeriennes Congolaises"
        },
        {
            "iata":"4W",
            "name":"Warbelow"
        },
        {
            "iata":"4Y",
            "name":"Flight Alaska"
        },
        {
            "iata":"5C",
            "name":"NatureAir"
        },
        {
            "iata":"5G",
            "name":"Skyservice Airlines"
        },
        {
            "iata":"5H",
            "name":"Five Forty Aviation"
        },
        {
            "iata":"5J",
            "name":"Cebu Air"
        },
        {
            "iata":"5L",
            "name":"Aerosur"
        },
        {
            "iata":"5M",
            "name":"FlyMontserrat"
        },
        {
            "iata":"5N",
            "name":"Nordavia"
        },
        {
            "iata":"5O",
            "name":"Europe Airpost"
        },
        {
            "iata":"5P",
            "name":"Aerolinea Principal"
        },
        {
            "iata":"5Q",
            "name":"BQB Air"
        },
        {
            "iata":"5R",
            "name":"Karthago Airlines"
        },
        {
            "iata":"5T",
            "name":"Canadian North"
        },
        {
            "iata":"5U",
            "name":"Royal Belau Airways"
        },
        {
            "iata":"5V",
            "name":"Lviv Airlines"
        },
        {
            "iata":"5W",
            "name":"Astraeus"
        },
        {
            "iata":"5Y",
            "name":"Express Rail Link"
        },
        {
            "iata":"5Z",
            "name":"Bismillah Airlines"
        },
        {
            "iata":"5�",
            "name":"Odessa Air"
        },
        {
            "iata":"6A",
            "name":"Aviacsa"
        },
        {
            "iata":"6C",
            "name":"Air Timor"
        },
        {
            "iata":"6E",
            "name":"IndiGo Air"
        },
        {
            "iata":"6F",
            "name":"MAT Airways"
        },
        {
            "iata":"6G",
            "name":"Gulfstream Connection"
        },
        {
            "iata":"6H",
            "name":"Israir Airlines"
        },
        {
            "iata":"6I",
            "name":"Fly 6ix"
        },
        {
            "iata":"6J",
            "name":"Jubba Airways"
        },
        {
            "iata":"6K",
            "name":"KyrgyzTransAvia"
        },
        {
            "iata":"6L",
            "name":"Aklak Air"
        },
        {
            "iata":"6N",
            "name":"Nordic Airways"
        },
        {
            "iata":"6P",
            "name":"Gryphon Airlines"
        },
        {
            "iata":"6Q",
            "name":"Cham Wings Airlines"
        },
        {
            "iata":"6R",
            "name":"Alrosa"
        },
        {
            "iata":"6S",
            "name":"Kato Airline"
        },
        {
            "iata":"6T",
            "name":"Air Mandalay Ltd"
        },
        {
            "iata":"6V",
            "name":"Mars RK"
        },
        {
            "iata":"6W",
            "name":"Saratov Air"
        },
        {
            "iata":"6Y",
            "name":"SMARTLYNX AIRLINES Ltd"
        },
        {
            "iata":"6Z",
            "name":"Euro-Asia Air"
        },
        {
            "iata":"7C",
            "name":"Jeju Airlines"
        },
        {
            "iata":"7D",
            "name":"Donbass Aero"
        },
        {
            "iata":"7E",
            "name":"Sylt Air Gmbh"
        },
        {
            "iata":"7F",
            "name":"First Air"
        },
        {
            "iata":"7G",
            "name":"Star Flyer"
        },
        {
            "iata":"7H",
            "name":"Era Aviation"
        },
        {
            "iata":"7I",
            "name":"Insel Air International"
        },
        {
            "iata":"7J",
            "name":"Tajik Air"
        },
        {
            "iata":"7K",
            "name":"Kogalym Avia"
        },
        {
            "iata":"7L",
            "name":"Aerocaribbean"
        },
        {
            "iata":"7M",
            "name":"Mayair, S.A. de C.V."
        },
        {
            "iata":"7N",
            "name":"National Airways"
        },
        {
            "iata":"7P",
            "name":"Air Castilla"
        },
        {
            "iata":"7R",
            "name":"Rusline Air"
        },
        {
            "iata":"7V",
            "name":"Federal Airlines (Pty) Ltd"
        },
        {
            "iata":"7W",
            "name":"Wind Rose"
        },
        {
            "iata":"7Z",
            "name":"Halcyonair Cabo Verde Airways S.A."
        },
        {
            "iata":"8B",
            "name":"Business Air Centre Co"
        },
        {
            "iata":"8D",
            "name":"Servant Air, Inc."
        },
        {
            "iata":"8E",
            "name":"Bering Air"
        },
        {
            "iata":"8F",
            "name":"STP Airways"
        },
        {
            "iata":"8G",
            "name":"Girjet"
        },
        {
            "iata":"8J",
            "name":"Jet4You.Com"
        },
        {
            "iata":"8L",
            "name":"Lucky Air Co. Ltd."
        },
        {
            "iata":"8M",
            "name":"Myanmar Airways"
        },
        {
            "iata":"8N",
            "name":"Barents Airlink"
        },
        {
            "iata":"8O",
            "name":"West Coast Air"
        },
        {
            "iata":"8P",
            "name":"Pacific Coastal Airlines"
        },
        {
            "iata":"8Q",
            "name":"Onur Air"
        },
        {
            "iata":"8R",
            "name":"TRIP Linhas Aereas S.A."
        },
        {
            "iata":"8T",
            "name":"Air Tindi Ltd"
        },
        {
            "iata":"8U",
            "name":"Afriqiyah Airways"
        },
        {
            "iata":"8V",
            "name":"Wright Air Service"
        },
        {
            "iata":"8W",
            "name":"Private Wings"
        },
        {
            "iata":"9B",
            "name":"Accesrail"
        },
        {
            "iata":"9C",
            "name":"Spring Airlines"
        },
        {
            "iata":"9D",
            "name":"Toumai Air Tchad"
        },
        {
            "iata":"9E",
            "name":"Pinnacle Airlines"
        },
        {
            "iata":"9F",
            "name":"Eurostar"
        },
        {
            "iata":"9G",
            "name":"9G Rail Ltd"
        },
        {
            "iata":"9H",
            "name":"Dutch Antilles Express"
        },
        {
            "iata":"9J",
            "name":"Dana Airlines Ltd"
        },
        {
            "iata":"9K",
            "name":"Cape Air"
        },
        {
            "iata":"9L",
            "name":"Colgan Airlines"
        },
        {
            "iata":"9M",
            "name":"Central Mountain Air"
        },
        {
            "iata":"9O",
            "name":"National Airways Cameroon"
        },
        {
            "iata":"9R",
            "name":"Satena"
        },
        {
            "iata":"9U",
            "name":"Air Moldova"
        },
        {
            "iata":"9V",
            "name":"Avior Airlines"
        },
        {
            "iata":"9W",
            "name":"Jet Airways"
        },
        {
            "iata":"9X",
            "name":"New Axis Airways"
        },
        {
            "iata":"9Y",
            "name":"Air Kazakstan"
        },
        {
            "iata":"A0",
            "name":"L'Avion"
        },
        {
            "iata":"A2",
            "name":"Astra Airlines"
        },
        {
            "iata":"A3",
            "name":"Aegean Airlines"
        },
        {
            "iata":"A4",
            "name":"Aerocon"
        },
        {
            "iata":"A5",
            "name":"Airlinair"
        },
        {
            "iata":"A6",
            "name":"Air Alps Aviation"
        },
        {
            "iata":"A7",
            "name":"Air Comet"
        },
        {
            "iata":"A8",
            "name":"Benin Golf Air"
        },
        {
            "iata":"A9",
            "name":"Georgian Airways"
        },
        {
            "iata":"AA",
            "name":"American Airlines"
        },
        {
            "iata":"AB",
            "name":"Air Berlin"
        },
        {
            "iata":"AC",
            "name":"Air Canada"
        },
        {
            "iata":"AD",
            "name":"Azul Airlines"
        },
        {
            "iata":"AE",
            "name":"Mandarin Airlines"
        },
        {
            "iata":"AF",
            "name":"Air France"
        },
        {
            "iata":"AH",
            "name":"Air Algerie"
        },
        {
            "iata":"AI",
            "name":"Nacil Air India"
        },
        {
            "iata":"AJ",
            "name":"Aerocontractors"
        },
        {
            "iata":"AK",
            "name":"Airasia"
        },
        {
            "iata":"AM",
            "name":"Aeromexico"
        },
        {
            "iata":"AO",
            "name":"Avianova"
        },
        {
            "iata":"AP",
            "name":"Air One"
        },
        {
            "iata":"AQ",
            "name":"Aloha Airlines"
        },
        {
            "iata":"AR",
            "name":"Aerolineas Argentinas"
        },
        {
            "iata":"AS",
            "name":"Alaska Airlines"
        },
        {
            "iata":"AT",
            "name":"Royal Air Maroc"
        },
        {
            "iata":"AU",
            "name":"Austral Lineas Aereas"
        },
        {
            "iata":"AV",
            "name":"Avianca"
        },
        {
            "iata":"AW",
            "name":"Africa World Airlines Limited"
        },
        {
            "iata":"AX",
            "name":"American Connection"
        },
        {
            "iata":"AY",
            "name":"Finnair"
        },
        {
            "iata":"AZ",
            "name":"Alitalia"
        },
        {
            "iata":"B2",
            "name":"Belavia"
        },
        {
            "iata":"B3",
            "name":"Bellview Airlines"
        },
        {
            "iata":"B5",
            "name":"East African Safari Air"
        },
        {
            "iata":"B6",
            "name":"JetBlue"
        },
        {
            "iata":"B7",
            "name":"Uni Air"
        },
        {
            "iata":"B8",
            "name":"Eritrean Airlines"
        },
        {
            "iata":"B9",
            "name":"Iran Air Tours"
        },
        {
            "iata":"BA",
            "name":"British Airways"
        },
        {
            "iata":"BB",
            "name":"Seaborne Airlines"
        },
        {
            "iata":"BC",
            "name":"Skymark Airlines"
        },
        {
            "iata":"BD",
            "name":"BMI"
        },
        {
            "iata":"BE",
            "name":"Flybe"
        },
        {
            "iata":"BF",
            "name":"Vincent Aviation"
        },
        {
            "iata":"BG",
            "name":"Biman Airlines"
        },
        {
            "iata":"BH",
            "name":"Hawkair"
        },
        {
            "iata":"BI",
            "name":"Royal Brunei"
        },
        {
            "iata":"BJ",
            "name":"Nouvelair"
        },
        {
            "iata":"BK",
            "name":"Okay Airways"
        },
        {
            "iata":"BL",
            "name":"Pacific Airlines"
        },
        {
            "iata":"BN",
            "name":"Bahrain Air"
        },
        {
            "iata":"BP",
            "name":"Air Botswana"
        },
        {
            "iata":"BR",
            "name":"Eva Air"
        },
        {
            "iata":"BS",
            "name":"British International"
        },
        {
            "iata":"BT",
            "name":"Air Baltic"
        },
        {
            "iata":"BU",
            "name":"SAS Norway"
        },
        {
            "iata":"BV",
            "name":"Blue Panorama Air"
        },
        {
            "iata":"BW",
            "name":"Caribbean Airlines"
        },
        {
            "iata":"BX",
            "name":"Coast Air"
        },
        {
            "iata":"C3",
            "name":"ICAR Airlines"
        },
        {
            "iata":"C4",
            "name":"Alma De Mexico"
        },
        {
            "iata":"C5",
            "name":"CommutAir"
        },
        {
            "iata":"C7",
            "name":"Rico Linhas Aereas"
        },
        {
            "iata":"C8",
            "name":"CRONOSAIR"
        },
        {
            "iata":"C9",
            "name":"Cirrus Airlines"
        },
        {
            "iata":"CA",
            "name":"Air China"
        },
        {
            "iata":"CB",
            "name":"Scotairways"
        },
        {
            "iata":"CC",
            "name":"Macair Airlines"
        },
        {
            "iata":"CE",
            "name":"Nationwide Air"
        },
        {
            "iata":"CF",
            "name":"City Airline"
        },
        {
            "iata":"CG",
            "name":"Airlines PNG"
        },
        {
            "iata":"CH",
            "name":"Bemidji Airlines"
        },
        {
            "iata":"CI",
            "name":"China Airlines"
        },
        {
            "iata":"CJ",
            "name":"China Northern Airlines"
        },
        {
            "iata":"CL",
            "name":"Lufthansa CityLine"
        },
        {
            "iata":"CM",
            "name":"Copa Airlines"
        },
        {
            "iata":"CN",
            "name":"Islands Nationair"
        },
        {
            "iata":"CO",
            "name":"Continental Airlines"
        },
        {
            "iata":"CQ",
            "name":"Sunshine Express Airlines"
        },
        {
            "iata":"CT",
            "name":"Civil Air Transport"
        },
        {
            "iata":"CU",
            "name":"Cubana"
        },
        {
            "iata":"CW",
            "name":"Air Marshall Islands"
        },
        {
            "iata":"CX",
            "name":"Cathay Pacific"
        },
        {
            "iata":"CY",
            "name":"Cyprus Airways"
        },
        {
            "iata":"CZ",
            "name":"China Southern Airlines"
        },
        {
            "iata":"D2",
            "name":"Severstal Air"
        },
        {
            "iata":"D3",
            "name":"Daallo Airlines"
        },
        {
            "iata":"D4",
            "name":"Alidaunia"
        },
        {
            "iata":"D6",
            "name":"Inter Air"
        },
        {
            "iata":"D7",
            "name":"Airasia X"
        },
        {
            "iata":"D9",
            "name":"Aeroflot-Don"
        },
        {
            "iata":"DB",
            "name":"Brit Air"
        },
        {
            "iata":"DC",
            "name":"Golden Air"
        },
        {
            "iata":"DD",
            "name":"Nok Air"
        },
        {
            "iata":"DE",
            "name":"Condor"
        },
        {
            "iata":"DG",
            "name":"South East Asian Airlines"
        },
        {
            "iata":"DH",
            "name":"Asia Sahand Airlines"
        },
        {
            "iata":"DI",
            "name":"DBA"
        },
        {
            "iata":"DJ",
            "name":"Virgin Blue"
        },
        {
            "iata":"DL",
            "name":"Delta Air Lines"
        },
        {
            "iata":"DN",
            "name":"Air Deccan"
        },
        {
            "iata":"DO",
            "name":"Air Vallee"
        },
        {
            "iata":"DR",
            "name":"Air Link"
        },
        {
            "iata":"DT",
            "name":"Taag"
        },
        {
            "iata":"DU",
            "name":"Hemus Air"
        },
        {
            "iata":"DV",
            "name":"Jsc Aircompany Scat"
        },
        {
            "iata":"DX",
            "name":"Danish Air Transport"
        },
        {
            "iata":"DY",
            "name":"Norwegian Air"
        },
        {
            "iata":"DZ",
            "name":"Djibouti Air"
        },
        {
            "iata":"E0",
            "name":"Eos Airlines"
        },
        {
            "iata":"E3",
            "name":"Domodedovo Airlines"
        },
        {
            "iata":"E4",
            "name":"Eastok Avia"
        },
        {
            "iata":"E5",
            "name":"Samara Airlines"
        },
        {
            "iata":"E8",
            "name":"JSC Semeyavia"
        },
        {
            "iata":"EA",
            "name":"European Air Express"
        },
        {
            "iata":"EC",
            "name":"Avialeasing"
        },
        {
            "iata":"EE",
            "name":"Aero Airlines"
        },
        {
            "iata":"EF",
            "name":"Far Eastern Air"
        },
        {
            "iata":"EG",
            "name":"Japan Asia Airways"
        },
        {
            "iata":"EI",
            "name":"Aer Lingus"
        },
        {
            "iata":"EJ",
            "name":"New England Airlines"
        },
        {
            "iata":"EK",
            "name":"Emirates"
        },
        {
            "iata":"EL",
            "name":"Air Nippon"
        },
        {
            "iata":"EN",
            "name":"Air Dolomiti"
        },
        {
            "iata":"EO",
            "name":"Hewa Bora Airways"
        },
        {
            "iata":"EP",
            "name":"Iran Aseman Airlines"
        },
        {
            "iata":"EQ",
            "name":"TAME Linea Aerea del Ecuador"
        },
        {
            "iata":"ET",
            "name":"Ethiopian Airlines"
        },
        {
            "iata":"EU",
            "name":"Chengdu Airlines"
        },
        {
            "iata":"EW",
            "name":"Eurowings"
        },
        {
            "iata":"EY",
            "name":"Etihad Airways"
        },
        {
            "iata":"EZ",
            "name":"Sun Air Of Scandinavia"
        },
        {
            "iata":"F2",
            "name":"SafariLink"
        },
        {
            "iata":"F5",
            "name":"Fly540 S.A"
        },
        {
            "iata":"F7",
            "name":"Flybaboo"
        },
        {
            "iata":"F9",
            "name":"Frontier Airlines"
        },
        {
            "iata":"FB",
            "name":"Bulgaria Air"
        },
        {
            "iata":"FC",
            "name":"Finncomm Airlines"
        },
        {
            "iata":"FD",
            "name":"Thai Airasia"
        },
        {
            "iata":"FE",
            "name":"Far Eastern Air Transport"
        },
        {
            "iata":"FG",
            "name":"Ariana Afghan Airlines"
        },
        {
            "iata":"FI",
            "name":"Icelandair"
        },
        {
            "iata":"FJ",
            "name":"Air Pacific"
        },
        {
            "iata":"FL",
            "name":"Airtran Airways"
        },
        {
            "iata":"FM",
            "name":"Shanghai Airlines"
        },
        {
            "iata":"FN",
            "name":"Regional Air Lines"
        },
        {
            "iata":"FO",
            "name":"Felix Airways"
        },
        {
            "iata":"FP",
            "name":"Freedom Air"
        },
        {
            "iata":"FQ",
            "name":"Brindabella Airlines"
        },
        {
            "iata":"FR",
            "name":"Ryanair"
        },
        {
            "iata":"FS",
            "name":"ItAli Airlines"
        },
        {
            "iata":"FT",
            "name":"Siem Reap Airways Intl"
        },
        {
            "iata":"FV",
            "name":"GTK Rossia"
        },
        {
            "iata":"FW",
            "name":"IBEX Airlines"
        },
        {
            "iata":"FY",
            "name":"Firefly"
        },
        {
            "iata":"FZ",
            "name":"Flydubai"
        },
        {
            "iata":"G0",
            "name":"Ghana Intl Airlines"
        },
        {
            "iata":"G3",
            "name":"Gol Transportes Aereos"
        },
        {
            "iata":"G4",
            "name":"Allegiant Air LLC"
        },
        {
            "iata":"G8",
            "name":"Go Air"
        },
        {
            "iata":"G9",
            "name":"Air Arabia"
        },
        {
            "iata":"GA",
            "name":"Garuda Indonesia"
        },
        {
            "iata":"GE",
            "name":"Transasia Airways"
        },
        {
            "iata":"GF",
            "name":"Gulf Air"
        },
        {
            "iata":"GI",
            "name":"Itek Air"
        },
        {
            "iata":"GJ",
            "name":"Eurofly"
        },
        {
            "iata":"GL",
            "name":"Air Greenland"
        },
        {
            "iata":"GQ",
            "name":"Big Sky Airlines"
        },
        {
            "iata":"GR",
            "name":"Aurigny Air"
        },
        {
            "iata":"GS",
            "name":"TianJin Airlines"
        },
        {
            "iata":"GT",
            "name":"GB Airways"
        },
        {
            "iata":"GU",
            "name":"Aviateca"
        },
        {
            "iata":"GV",
            "name":"Grant Aviation, Inc."
        },
        {
            "iata":"GW",
            "name":"Kuban Airlines"
        },
        {
            "iata":"GY",
            "name":"Gabon Airlines"
        },
        {
            "iata":"GZ",
            "name":"Air Rarotonga"
        },
        {
            "iata":"H2",
            "name":"Sky Airline"
        },
        {
            "iata":"H3",
            "name":"Harbour Air"
        },
        {
            "iata":"H4",
            "name":"Heli Securite"
        },
        {
            "iata":"H7",
            "name":"Eagle Air"
        },
        {
            "iata":"H8",
            "name":"Dalavia"
        },
        {
            "iata":"H9",
            "name":"Pegasus Airlines"
        },
        {
            "iata":"HA",
            "name":"Hawaiian Airlines"
        },
        {
            "iata":"HB",
            "name":"Homer Air"
        },
        {
            "iata":"HD",
            "name":"Hokkaido International Airlines"
        },
        {
            "iata":"HE",
            "name":"LGW"
        },
        {
            "iata":"HF",
            "name":"Hapagfly"
        },
        {
            "iata":"HG",
            "name":"Niki"
        },
        {
            "iata":"HH",
            "name":"Taban Air"
        },
        {
            "iata":"HI",
            "name":"Papillon Airways"
        },
        {
            "iata":"HM",
            "name":"Air Seychelles"
        },
        {
            "iata":"HO",
            "name":"Juneyao Airlines"
        },
        {
            "iata":"HR",
            "name":"Hahn Air"
        },
        {
            "iata":"HS",
            "name":"Svenska Air"
        },
        {
            "iata":"HT",
            "name":"Aeromist-Kharkov"
        },
        {
            "iata":"HU",
            "name":"Hainan Airlines"
        },
        {
            "iata":"HV",
            "name":"Transavia.com"
        },
        {
            "iata":"HW",
            "name":"North-Wright Airways Ltd."
        },
        {
            "iata":"HX",
            "name":"Hong Kong Airlines"
        },
        {
            "iata":"HY",
            "name":"Uzbekistan Airways"
        },
        {
            "iata":"HZ",
            "name":"SAT Airlines"
        },
        {
            "iata":"I2",
            "name":"Munich Airlines"
        },
        {
            "iata":"I3",
            "name":"ATA Airlines"
        },
        {
            "iata":"I4",
            "name":"International AirLink"
        },
        {
            "iata":"I5",
            "name":"Compagnie Aerienne Mali"
        },
        {
            "iata":"I7",
            "name":"Paramount Airways"
        },
        {
            "iata":"I8",
            "name":"Izhavia"
        },
        {
            "iata":"I9",
            "name":"Air Italy"
        },
        {
            "iata":"IA",
            "name":"Iraqi Airways"
        },
        {
            "iata":"IB",
            "name":"Iberia"
        },
        {
            "iata":"IC",
            "name":"Nacil Indian Airline"
        },
        {
            "iata":"IE",
            "name":"Solomon Airlines"
        },
        {
            "iata":"IF",
            "name":"Islas Airways"
        },
        {
            "iata":"IG",
            "name":"Meridiana"
        },
        {
            "iata":"IH",
            "name":"Falcon Air"
        },
        {
            "iata":"IK",
            "name":"Imair Airline"
        },
        {
            "iata":"IN",
            "name":"Macedonian Airlines"
        },
        {
            "iata":"IP",
            "name":"Atyrau Aue Joly"
        },
        {
            "iata":"IQ",
            "name":"Augsburg Airways"
        },
        {
            "iata":"IR",
            "name":"Iran Air"
        },
        {
            "iata":"IS",
            "name":"Island Airlines, Inc."
        },
        {
            "iata":"IT",
            "name":"Kingfisher Airlines"
        },
        {
            "iata":"IV",
            "name":"Wind Jet"
        },
        {
            "iata":"IX",
            "name":"Air India Express"
        },
        {
            "iata":"IY",
            "name":"Yemenia Airways"
        },
        {
            "iata":"IZ",
            "name":"Arkia"
        },
        {
            "iata":"J0",
            "name":"Jetlink Express"
        },
        {
            "iata":"J2",
            "name":"Azerbaijan Airlines"
        },
        {
            "iata":"J3",
            "name":"Northwestern Air"
        },
        {
            "iata":"J4",
            "name":"Jet For You"
        },
        {
            "iata":"J5",
            "name":"Alaska Seaplane Service L.L.C."
        },
        {
            "iata":"J6",
            "name":"Avcom"
        },
        {
            "iata":"J7",
            "name":"Centre-Avia Airlines"
        },
        {
            "iata":"J8",
            "name":"Berjaya Air"
        },
        {
            "iata":"J9",
            "name":"Jazeera Airways"
        },
        {
            "iata":"JA",
            "name":"B&H Airlines"
        },
        {
            "iata":"JB",
            "name":"Helijet International"
        },
        {
            "iata":"JD",
            "name":"Beijing Capital Airlines"
        },
        {
            "iata":"JE",
            "name":"Mango"
        },
        {
            "iata":"JH",
            "name":"Fuji Dream Airlines"
        },
        {
            "iata":"JJ",
            "name":"Tam Linhas Aereas"
        },
        {
            "iata":"JK",
            "name":"Spanair"
        },
        {
            "iata":"JL",
            "name":"Japan Airlines"
        },
        {
            "iata":"JM",
            "name":"Air Jamaica"
        },
        {
            "iata":"JN",
            "name":"Avia-Jaynar"
        },
        {
            "iata":"JO",
            "name":"Jalways"
        },
        {
            "iata":"JP",
            "name":"Adria Airways"
        },
        {
            "iata":"JQ",
            "name":"Jetstar"
        },
        {
            "iata":"JR",
            "name":"Joy Air"
        },
        {
            "iata":"JS",
            "name":"Air Koryo"
        },
        {
            "iata":"JT",
            "name":"Lion Air"
        },
        {
            "iata":"JU",
            "name":"Jat Airways"
        },
        {
            "iata":"JV",
            "name":"Bearskin Airlines"
        },
        {
            "iata":"JX",
            "name":"Nice Helicopteres"
        },
        {
            "iata":"JY",
            "name":"Air Turks "
        },
        {
            "iata":"JZ",
            "name":"Skyways Ab"
        },
        {
            "iata":"K2",
            "name":"Eurolot"
        },
        {
            "iata":"K3",
            "name":"Taquan Air Services"
        },
        {
            "iata":"K5",
            "name":"Wings Of Alaska SeaPort Airline"
        },
        {
            "iata":"K6",
            "name":"Bravo Air Congo"
        },
        {
            "iata":"K7",
            "name":"Air KBZ"
        },
        {
            "iata":"K8",
            "name":"Zambia Skyways"
        },
        {
            "iata":"K9",
            "name":"TonleSap Airlines"
        },
        {
            "iata":"KA",
            "name":"Dragonair"
        },
        {
            "iata":"KB",
            "name":"Druk Air"
        },
        {
            "iata":"KC",
            "name":"Air Astana"
        },
        {
            "iata":"KD",
            "name":"KD Avia"
        },
        {
            "iata":"KE",
            "name":"Korean Air"
        },
        {
            "iata":"KF",
            "name":"Blue1"
        },
        {
            "iata":"KG",
            "name":"Aerogaviota"
        },
        {
            "iata":"KH",
            "name":"Kyrgyz Air"
        },
        {
            "iata":"KI",
            "name":"Kuban Airlines"
        },
        {
            "iata":"KJ",
            "name":"BMED"
        },
        {
            "iata":"KK",
            "name":"Atlasjet Airlines"
        },
        {
            "iata":"KL",
            "name":"KLM"
        },
        {
            "iata":"KM",
            "name":"Air Malta"
        },
        {
            "iata":"KN",
            "name":"China United Airlines"
        },
        {
            "iata":"KO",
            "name":"KHors"
        },
        {
            "iata":"KQ",
            "name":"Kenya Airways"
        },
        {
            "iata":"KR",
            "name":"Comores Aviation"
        },
        {
            "iata":"KS",
            "name":"Penair"
        },
        {
            "iata":"KT",
            "name":"Katmai Air LLC"
        },
        {
            "iata":"KU",
            "name":"Kuwait Airways"
        },
        {
            "iata":"KV",
            "name":"Kavminvody Avia"
        },
        {
            "iata":"KW",
            "name":"Wataniya Airways"
        },
        {
            "iata":"KX",
            "name":"Cayman Airways"
        },
        {
            "iata":"KY",
            "name":"Kunming Airlines"
        },
        {
            "iata":"L3",
            "name":"LTU"
        },
        {
            "iata":"L5",
            "name":"Lufttransport As"
        },
        {
            "iata":"L6",
            "name":"Tbilaviamsheni"
        },
        {
            "iata":"L9",
            "name":"Belle Air Europe"
        },
        {
            "iata":"LA",
            "name":"Lan Airlines"
        },
        {
            "iata":"LF",
            "name":"Flynordic"
        },
        {
            "iata":"LG",
            "name":"Luxair"
        },
        {
            "iata":"LH",
            "name":"Lufthansa"
        },
        {
            "iata":"LI",
            "name":"Liat"
        },
        {
            "iata":"LJ",
            "name":"Jin Air"
        },
        {
            "iata":"LM",
            "name":"Livingston"
        },
        {
            "iata":"LN",
            "name":"Libyan Airlines"
        },
        {
            "iata":"LO",
            "name":"LOT Polish Airlines"
        },
        {
            "iata":"LP",
            "name":"LAN Peru"
        },
        {
            "iata":"LR",
            "name":"Lacsa"
        },
        {
            "iata":"LS",
            "name":"Jet2.com"
        },
        {
            "iata":"LT",
            "name":"LTU"
        },
        {
            "iata":"LV",
            "name":"Albanian Airlines"
        },
        {
            "iata":"LW",
            "name":"Pacific Wings"
        },
        {
            "iata":"LX",
            "name":"Swiss"
        },
        {
            "iata":"LY",
            "name":"El Al"
        },
        {
            "iata":"LZ",
            "name":"Belle Air"
        },
        {
            "iata":"M2",
            "name":"AIR MANAS"
        },
        {
            "iata":"M3",
            "name":"North Flying As"
        },
        {
            "iata":"M5",
            "name":"Kenmore Air"
        },
        {
            "iata":"M6",
            "name":"Meta Linhas Aereas"
        },
        {
            "iata":"M7",
            "name":"MAS AIR"
        },
        {
            "iata":"M9",
            "name":"Motor-Sich JSC"
        },
        {
            "iata":"MA",
            "name":"Malev"
        },
        {
            "iata":"MD",
            "name":"Air Madagascar"
        },
        {
            "iata":"ME",
            "name":"Middle East Airlines"
        },
        {
            "iata":"MF",
            "name":"Xiamen Airlines"
        },
        {
            "iata":"MH",
            "name":"Malaysia Airlines"
        },
        {
            "iata":"MI",
            "name":"Silkair"
        },
        {
            "iata":"MJ",
            "name":"Mihin Lanka"
        },
        {
            "iata":"MK",
            "name":"Air Mauritius"
        },
        {
            "iata":"ML",
            "name":"Air Mediterranee"
        },
        {
            "iata":"MM",
            "name":"Soc Aero De Medellin"
        },
        {
            "iata":"MN",
            "name":"Comair"
        },
        {
            "iata":"MO",
            "name":"Calm Air International"
        },
        {
            "iata":"MP",
            "name":"Martinair"
        },
        {
            "iata":"MS",
            "name":"Egyptair"
        },
        {
            "iata":"MU",
            "name":"China Eastern Airlines"
        },
        {
            "iata":"MW",
            "name":"Maya Island Air"
        },
        {
            "iata":"MX",
            "name":"Mexicana"
        },
        {
            "iata":"MY",
            "name":"Maxjet Airways"
        },
        {
            "iata":"MZ",
            "name":"Saereo S.A"
        },
        {
            "iata":"N2",
            "name":"Dagestan Airlines"
        },
        {
            "iata":"N3",
            "name":"Omskavia"
        },
        {
            "iata":"N4",
            "name":"Trans Air Benin"
        },
        {
            "iata":"N5",
            "name":"Norfolk Air"
        },
        {
            "iata":"N6",
            "name":"Alpine Air Private Ltd."
        },
        {
            "iata":"N7",
            "name":"Lagun Air"
        },
        {
            "iata":"N9",
            "name":"Kabo Air"
        },
        {
            "iata":"NA",
            "name":"North American Airlines"
        },
        {
            "iata":"NC",
            "name":"National Jet Systems"
        },
        {
            "iata":"ND",
            "name":"Sky Wings Airlines"
        },
        {
            "iata":"NF",
            "name":"Air Vanuatu"
        },
        {
            "iata":"NG",
            "name":"Lauda Air"
        },
        {
            "iata":"NH",
            "name":"All Nippon Airways"
        },
        {
            "iata":"NI",
            "name":"PGA-Portug_lia Airlines"
        },
        {
            "iata":"NK",
            "name":"Spirit Airlines"
        },
        {
            "iata":"NL",
            "name":"Shaheen Air International"
        },
        {
            "iata":"NM",
            "name":"Manx2"
        },
        {
            "iata":"NN",
            "name":"VIM Airlines"
        },
        {
            "iata":"NQ",
            "name":"Air Japan"
        },
        {
            "iata":"NR",
            "name":"Max Air"
        },
        {
            "iata":"NS",
            "name":"Hebei Airlines"
        },
        {
            "iata":"NT",
            "name":"Binter Canarias"
        },
        {
            "iata":"NU",
            "name":"Japan Transocean Air"
        },
        {
            "iata":"NW",
            "name":"Northwest Airlines"
        },
        {
            "iata":"NX",
            "name":"Air Macau"
        },
        {
            "iata":"NY",
            "name":"Air Iceland"
        },
        {
            "iata":"NZ",
            "name":"Air New Zealand"
        },
        {
            "iata":"O2",
            "name":"Oceanic Airlines"
        },
        {
            "iata":"O4",
            "name":"Antrak Air"
        },
        {
            "iata":"O6",
            "name":"OceanAir"
        },
        {
            "iata":"O7",
            "name":"Ozjet"
        },
        {
            "iata":"OA",
            "name":"Olympic Airlines"
        },
        {
            "iata":"OB",
            "name":"Boliviana de Aviacion - BoA"
        },
        {
            "iata":"OC",
            "name":"Oriental Air Bridge Co., Ltd. (ORC)"
        },
        {
            "iata":"OF",
            "name":"Air Finland"
        },
        {
            "iata":"OG",
            "name":"One Two Go Airlines"
        },
        {
            "iata":"OK",
            "name":"Czech Airlines"
        },
        {
            "iata":"OL",
            "name":"Olt Ostfriesische Lufttr"
        },
        {
            "iata":"OM",
            "name":"Miat Mongolian Airlines"
        },
        {
            "iata":"ON",
            "name":"Our Airline"
        },
        {
            "iata":"OP",
            "name":"Chalk Ocean Airways"
        },
        {
            "iata":"OR",
            "name":"Arkefly"
        },
        {
            "iata":"OS",
            "name":"Austrian"
        },
        {
            "iata":"OT",
            "name":"Aeropelican Air Services"
        },
        {
            "iata":"OU",
            "name":"Croatia Airlines"
        },
        {
            "iata":"OV",
            "name":"Estonian Air"
        },
        {
            "iata":"OX",
            "name":"Orient Thai Airlines"
        },
        {
            "iata":"OY",
            "name":"Andes Lineas Aereas"
        },
        {
            "iata":"OZ",
            "name":"Asiana Airlines"
        },
        {
            "iata":"P0",
            "name":"Proflight Commuter Services"
        },
        {
            "iata":"P2",
            "name":"AirKenya Express"
        },
        {
            "iata":"P3",
            "name":"Passaredo"
        },
        {
            "iata":"P4",
            "name":"Aero Lineas Sosa"
        },
        {
            "iata":"P5",
            "name":"Aerorepublica"
        },
        {
            "iata":"P6",
            "name":"Pascan Aviation Inc."
        },
        {
            "iata":"P8",
            "name":"Pantanal Linhas Aereas"
        },
        {
            "iata":"P9",
            "name":"Perm Airlines"
        },
        {
            "iata":"PB",
            "name":"Provincial Airlines"
        },
        {
            "iata":"PC",
            "name":"Air Fiji"
        },
        {
            "iata":"PD",
            "name":"Porter Airlines Inc."
        },
        {
            "iata":"PE",
            "name":"Peoples Vienna Line"
        },
        {
            "iata":"PG",
            "name":"Bangkok Airways"
        },
        {
            "iata":"PJ",
            "name":"Air Saint Pierre"
        },
        {
            "iata":"PK",
            "name":"Pakistan International Airlines"
        },
        {
            "iata":"PL",
            "name":"Southern Air Charter"
        },
        {
            "iata":"PM",
            "name":"Pamir Airways"
        },
        {
            "iata":"PN",
            "name":"China West Air"
        },
        {
            "iata":"PR",
            "name":"Philippine Airlines"
        },
        {
            "iata":"PS",
            "name":"Ukraine Intl Airlines"
        },
        {
            "iata":"PU",
            "name":"Pluna"
        },
        {
            "iata":"PV",
            "name":"Saint Barth Commuter"
        },
        {
            "iata":"PW",
            "name":"Precision Air"
        },
        {
            "iata":"PX",
            "name":"Air Niugini"
        },
        {
            "iata":"PY",
            "name":"Surinam Airways"
        },
        {
            "iata":"PZ",
            "name":"Tam Mercosur"
        },
        {
            "iata":"Q2",
            "name":"Maldivian"
        },
        {
            "iata":"Q3",
            "name":"Anguilla Air Services"
        },
        {
            "iata":"Q4",
            "name":"Starlink Aviation"
        },
        {
            "iata":"Q5",
            "name":"40 Mile Air"
        },
        {
            "iata":"Q6",
            "name":"Skytrans"
        },
        {
            "iata":"Q7",
            "name":"SkyBahamas"
        },
        {
            "iata":"Q8",
            "name":"Trans Air Congo"
        },
        {
            "iata":"QB",
            "name":"Georgian National Air"
        },
        {
            "iata":"QC",
            "name":"Air Corridor"
        },
        {
            "iata":"QF",
            "name":"Qantas Airways"
        },
        {
            "iata":"QG",
            "name":"Global Aviation"
        },
        {
            "iata":"QH",
            "name":"Kyrgyzstan Air"
        },
        {
            "iata":"QI",
            "name":"Cimber Air"
        },
        {
            "iata":"QK",
            "name":"Air Canada Jazz"
        },
        {
            "iata":"QL",
            "name":"LASER Airlines"
        },
        {
            "iata":"QM",
            "name":"Air Malawi"
        },
        {
            "iata":"QP",
            "name":"Airkenya Aviation"
        },
        {
            "iata":"QR",
            "name":"Qatar Airways"
        },
        {
            "iata":"QS",
            "name":"Smart Wings"
        },
        {
            "iata":"QU",
            "name":"East African Airlines"
        },
        {
            "iata":"QV",
            "name":"Lao Airlines"
        },
        {
            "iata":"QW",
            "name":"Blue Wings"
        },
        {
            "iata":"QX",
            "name":"Horizon Air"
        },
        {
            "iata":"QZ",
            "name":"PT Indonesia Airasia"
        },
        {
            "iata":"R2",
            "name":"Orenair"
        },
        {
            "iata":"R3",
            "name":"Yakutia Air"
        },
        {
            "iata":"R4",
            "name":"STC Russia"
        },
        {
            "iata":"R6",
            "name":"Danu Oro Transportas"
        },
        {
            "iata":"R7",
            "name":"Aserca"
        },
        {
            "iata":"RA",
            "name":"Royal Nepal Airlines"
        },
        {
            "iata":"RB",
            "name":"Syrian Arab Airlines"
        },
        {
            "iata":"RC",
            "name":"Atlantic Airways"
        },
        {
            "iata":"RE",
            "name":"Aer Arann"
        },
        {
            "iata":"RG",
            "name":"VRG Linhas Aereas Sa"
        },
        {
            "iata":"RH",
            "name":"Robin Hood Aviation"
        },
        {
            "iata":"RI",
            "name":"Mandala Airlines"
        },
        {
            "iata":"RJ",
            "name":"Royal Jordanian"
        },
        {
            "iata":"RK",
            "name":"REGION-AVIA"
        },
        {
            "iata":"RL",
            "name":"Royal Falcon"
        },
        {
            "iata":"RO",
            "name":"Tarom"
        },
        {
            "iata":"RQ",
            "name":"Kam Air"
        },
        {
            "iata":"RT",
            "name":"Rak Airways"
        },
        {
            "iata":"RU",
            "name":"TCI Skyking Ltd"
        },
        {
            "iata":"RV",
            "name":"Caspian Airlines"
        },
        {
            "iata":"RX",
            "name":"Regent Airways"
        },
        {
            "iata":"RZ",
            "name":"SANSA Airlines"
        },
        {
            "iata":"S0",
            "name":"Slok Air International"
        },
        {
            "iata":"S2",
            "name":"Jet Lite"
        },
        {
            "iata":"S3",
            "name":"Santa Barbara Airlines"
        },
        {
            "iata":"S4",
            "name":"SATA International"
        },
        {
            "iata":"S5",
            "name":"Shuttle America"
        },
        {
            "iata":"S6",
            "name":"Sun Air"
        },
        {
            "iata":"S7",
            "name":"S7"
        },
        {
            "iata":"S9",
            "name":"Starbow Airlines"
        },
        {
            "iata":"SA",
            "name":"South African Airways"
        },
        {
            "iata":"SB",
            "name":"Aircalin"
        },
        {
            "iata":"SC",
            "name":"Shandong Airlines Co., Ltd."
        },
        {
            "iata":"SD",
            "name":"Sudan Airways"
        },
        {
            "iata":"SE",
            "name":"XL Airways France"
        },
        {
            "iata":"SF",
            "name":"Tassili Airlines"
        },
        {
            "iata":"SG",
            "name":"SpiceJet"
        },
        {
            "iata":"SH",
            "name":"Sharp Airlines"
        },
        {
            "iata":"SI",
            "name":"Blue Islands"
        },
        {
            "iata":"SJ",
            "name":"Sriwijaya Air"
        },
        {
            "iata":"SK",
            "name":"Scandinavian Airlines"
        },
        {
            "iata":"SL",
            "name":"Solenta Aviation"
        },
        {
            "iata":"SM",
            "name":"Spirit of Manila Airlines"
        },
        {
            "iata":"SN",
            "name":"Brussels Airlines"
        },
        {
            "iata":"SO",
            "name":"SALSA d"
        },
        {
            "iata":"SP",
            "name":"SATA Air Acores"
        },
        {
            "iata":"SQ",
            "name":"Singapore Airlines"
        },
        {
            "iata":"SS",
            "name":"Corsair"
        },
        {
            "iata":"SU",
            "name":"Aeroflot"
        },
        {
            "iata":"SV",
            "name":"Saudi Arabian Airlines"
        },
        {
            "iata":"SW",
            "name":"Air Namibia"
        },
        {
            "iata":"SX",
            "name":"Skybus Airlines"
        },
        {
            "iata":"SY",
            "name":"Sun Country"
        },
        {
            "iata":"T3",
            "name":"Eastern Airways"
        },
        {
            "iata":"T4",
            "name":"TRIP Linhas Aereas"
        },
        {
            "iata":"T5",
            "name":"Turkmenistan Airlines"
        },
        {
            "iata":"T6",
            "name":"Tavrey Aircompany"
        },
        {
            "iata":"T7",
            "name":"Twin Jet"
        },
        {
            "iata":"TA",
            "name":"Taca Intl Airlines"
        },
        {
            "iata":"TC",
            "name":"Air Tanzania"
        },
        {
            "iata":"TD",
            "name":"Atlantis European Airway"
        },
        {
            "iata":"TE",
            "name":"FlyLAL"
        },
        {
            "iata":"TF",
            "name":"Malmo Aviation"
        },
        {
            "iata":"TG",
            "name":"Thai Airways Intl"
        },
        {
            "iata":"TJ",
            "name":"Tradewind Aviation"
        },
        {
            "iata":"TK",
            "name":"Turkish Airlines"
        },
        {
            "iata":"TL",
            "name":"Airnorth Regional"
        },
        {
            "iata":"TM",
            "name":"Lam Mozambique"
        },
        {
            "iata":"TN",
            "name":"Air Tahiti Nui"
        },
        {
            "iata":"TO",
            "name":"Transavia.com France"
        },
        {
            "iata":"TP",
            "name":"TAP Portugal"
        },
        {
            "iata":"TQ",
            "name":"Tandem Aero"
        },
        {
            "iata":"TR",
            "name":"Tiger Airways"
        },
        {
            "iata":"TS",
            "name":"Air Transat"
        },
        {
            "iata":"TT",
            "name":"Tiger Airways Australia"
        },
        {
            "iata":"TU",
            "name":"Tunisair"
        },
        {
            "iata":"TV",
            "name":"Tibet Airlines"
        },
        {
            "iata":"TW",
            "name":"T"
        },
        {
            "iata":"TX",
            "name":"Air Caraibes"
        },
        {
            "iata":"TY",
            "name":"Air Caledonie"
        },
        {
            "iata":"TZ",
            "name":"ATA Airlines"
        },
        {
            "iata":"U2",
            "name":"EasyJet"
        },
        {
            "iata":"U3",
            "name":"Avies Air Company"
        },
        {
            "iata":"U4",
            "name":"PMT Air"
        },
        {
            "iata":"U5",
            "name":"USA 3000"
        },
        {
            "iata":"U6",
            "name":"Ural Airlines"
        },
        {
            "iata":"U7",
            "name":"Air Uganda"
        },
        {
            "iata":"U8",
            "name":"Armavia"
        },
        {
            "iata":"U9",
            "name":"Tatarstan Air"
        },
        {
            "iata":"UA",
            "name":"United Airlines"
        },
        {
            "iata":"UB",
            "name":"Myanma Airways"
        },
        {
            "iata":"UD",
            "name":"Hex Air"
        },
        {
            "iata":"UE",
            "name":"Nasair"
        },
        {
            "iata":"UF",
            "name":"UM Air"
        },
        {
            "iata":"UG",
            "name":"Sevenair"
        },
        {
            "iata":"UH",
            "name":"US Helicopter Corp"
        },
        {
            "iata":"UJ",
            "name":"Almasria Universal Airlines"
        },
        {
            "iata":"UL",
            "name":"Srilankan Airlines"
        },
        {
            "iata":"UM",
            "name":"Air Zimbabwe"
        },
        {
            "iata":"UN",
            "name":"Transaero"
        },
        {
            "iata":"UO",
            "name":"Hong Kong Express Airways"
        },
        {
            "iata":"UP",
            "name":"Bahamasair"
        },
        {
            "iata":"UQ",
            "name":"O Connor Airlines"
        },
        {
            "iata":"UR",
            "name":"UT Air"
        },
        {
            "iata":"US",
            "name":"US Airways"
        },
        {
            "iata":"UT",
            "name":"UT Air"
        },
        {
            "iata":"UU",
            "name":"Air Austral"
        },
        {
            "iata":"UV",
            "name":"Helicopteros Del Sureste"
        },
        {
            "iata":"UX",
            "name":"Air Europa"
        },
        {
            "iata":"UY",
            "name":"Cameroon Airlines"
        },
        {
            "iata":"UZ",
            "name":"Buraq Air"
        },
        {
            "iata":"V0",
            "name":"Conviasa"
        },
        {
            "iata":"V2",
            "name":"Vision Airlines"
        },
        {
            "iata":"V3",
            "name":"Carpatair"
        },
        {
            "iata":"V4",
            "name":"Vieques Air Link"
        },
        {
            "iata":"V5",
            "name":"Danube Wings"
        },
        {
            "iata":"V6",
            "name":"VIP S.A."
        },
        {
            "iata":"V7",
            "name":"Air Senegal"
        },
        {
            "iata":"V8",
            "name":"Iliamna Air Taxi"
        },
        {
            "iata":"VA",
            "name":"V Australia"
        },
        {
            "iata":"VB",
            "name":"VivaAerobus"
        },
        {
            "iata":"VC",
            "name":"Strategic Airlines Pty Ltd"
        },
        {
            "iata":"VE",
            "name":"Avensa"
        },
        {
            "iata":"VF",
            "name":"Valuair"
        },
        {
            "iata":"VG",
            "name":"VLM Airlines"
        },
        {
            "iata":"VH",
            "name":"Aeropostal"
        },
        {
            "iata":"VK",
            "name":"Virgin Nigeria"
        },
        {
            "iata":"VM",
            "name":"Viaggio Air"
        },
        {
            "iata":"VN",
            "name":"Vietnam Airlines"
        },
        {
            "iata":"VO",
            "name":"Tyrolean Airways"
        },
        {
            "iata":"VQ",
            "name":"Viking Hellas Airlines"
        },
        {
            "iata":"VR",
            "name":"Tacv Cabo Verde Airlines"
        },
        {
            "iata":"VS",
            "name":"Virgin Atlantic"
        },
        {
            "iata":"VT",
            "name":"Air Tahiti"
        },
        {
            "iata":"VU",
            "name":"Air Ivoire"
        },
        {
            "iata":"VV",
            "name":"Aerosvit Airlines"
        },
        {
            "iata":"VW",
            "name":"Aeromar"
        },
        {
            "iata":"VX",
            "name":"Virgin America "
        },
        {
            "iata":"VY",
            "name":"Vueling Airlines"
        },
        {
            "iata":"VZ",
            "name":"Velvet Sky"
        },
        {
            "iata":"W2",
            "name":"Canadian Western Air"
        },
        {
            "iata":"W3",
            "name":"Arik Air"
        },
        {
            "iata":"W4",
            "name":"LC Busre"
        },
        {
            "iata":"W5",
            "name":"Mahan Airlines"
        },
        {
            "iata":"W6",
            "name":"Wizz Air"
        },
        {
            "iata":"W7",
            "name":"Sayakhat Airlines"
        },
        {
            "iata":"W9",
            "name":"Air Bagan"
        },
        {
            "iata":"WA",
            "name":"KLM Cityhopper"
        },
        {
            "iata":"WB",
            "name":"Rwandair Express"
        },
        {
            "iata":"WC",
            "name":"Islena Airlines"
        },
        {
            "iata":"WF",
            "name":"Wideroe"
        },
        {
            "iata":"WH",
            "name":"Webjet Linhas Aereas"
        },
        {
            "iata":"WJ",
            "name":"Air Labrador"
        },
        {
            "iata":"WK",
            "name":"Edelweiss Air"
        },
        {
            "iata":"WL",
            "name":"Aeroperlas"
        },
        {
            "iata":"WM",
            "name":"Windward Island Airways"
        },
        {
            "iata":"WN",
            "name":"Southwest Airlines"
        },
        {
            "iata":"WP",
            "name":"Island Air"
        },
        {
            "iata":"WR",
            "name":"JSC Aviaprad"
        },
        {
            "iata":"WS",
            "name":"Westjet"
        },
        {
            "iata":"WT",
            "name":"Wasaya Airways LP"
        },
        {
            "iata":"WU",
            "name":"Wizz Air Ukraine"
        },
        {
            "iata":"WW",
            "name":"bmibaby"
        },
        {
            "iata":"WX",
            "name":"Cityjet"
        },
        {
            "iata":"WY",
            "name":"Oman Air"
        },
        {
            "iata":"X3",
            "name":"TUIfly"
        },
        {
            "iata":"X4",
            "name":"Air Excursions, LLC"
        },
        {
            "iata":"X7",
            "name":"Air Service"
        },
        {
            "iata":"X9",
            "name":"City Star Airlines"
        },
        {
            "iata":"XC",
            "name":"KD Air"
        },
        {
            "iata":"XE",
            "name":"Expressjet Airlines"
        },
        {
            "iata":"XF",
            "name":"Vladivostok Air"
        },
        {
            "iata":"XK",
            "name":"CCM Airlines"
        },
        {
            "iata":"XL",
            "name":"LAN Ecuador"
        },
        {
            "iata":"XM",
            "name":"Alitalia Express"
        },
        {
            "iata":"XP",
            "name":"Xtra Airways"
        },
        {
            "iata":"XQ",
            "name":"Sun Express"
        },
        {
            "iata":"XR",
            "name":"Skywest Airlines"
        },
        {
            "iata":"XU",
            "name":"African Express Airways"
        },
        {
            "iata":"XV",
            "name":"BVI Airways"
        },
        {
            "iata":"XW",
            "name":"Sky Express"
        },
        {
            "iata":"XY",
            "name":"Al-Khayala"
        },
        {
            "iata":"Y0",
            "name":"Yellow Airtaxi"
        },
        {
            "iata":"Y1",
            "name":"Taymir"
        },
        {
            "iata":"Y4",
            "name":"Volaris"
        },
        {
            "iata":"Y5",
            "name":"Asia Wings"
        },
        {
            "iata":"Y7",
            "name":"NordStar"
        },
        {
            "iata":"Y8",
            "name":"Passaredo Linhas Aereas"
        },
        {
            "iata":"Y9",
            "name":"Kish Air"
        },
        {
            "iata":"YC",
            "name":"Yamal Air"
        },
        {
            "iata":"YD",
            "name":"Mauritania Airways"
        },
        {
            "iata":"YG",
            "name":"South Airlines"
        },
        {
            "iata":"YI",
            "name":"Air Sunshine"
        },
        {
            "iata":"YK",
            "name":"Cyprus Turkish Airlines"
        },
        {
            "iata":"YL",
            "name":"Yamal Airlines"
        },
        {
            "iata":"YM",
            "name":"Montenegro Airlines"
        },
        {
            "iata":"YN",
            "name":"Air Creebec (1994) Inc."
        },
        {
            "iata":"YO",
            "name":"Heli Air Monaco"
        },
        {
            "iata":"YQ",
            "name":"Polet Airlines"
        },
        {
            "iata":"YR",
            "name":"Scenic Airlines"
        },
        {
            "iata":"YS",
            "name":"Regional"
        },
        {
            "iata":"YT",
            "name":"Yeti Airlines"
        },
        {
            "iata":"YU",
            "name":"Euroatlantic Airways"
        },
        {
            "iata":"YV",
            "name":"Mesa Airlines"
        },
        {
            "iata":"YW",
            "name":"Air Nostrum"
        },
        {
            "iata":"YX",
            "name":"Midwest Airlines"
        },
        {
            "iata":"Z2",
            "name":"Zestair"
        },
        {
            "iata":"Z3",
            "name":"PM Air LLC"
        },
        {
            "iata":"Z4",
            "name":"Puma Air"
        },
        {
            "iata":"Z5",
            "name":"GMG Airlines"
        },
        {
            "iata":"Z6",
            "name":"Dnieproavia"
        },
        {
            "iata":"Z8",
            "name":"Amaszonas"
        },
        {
            "iata":"ZA",
            "name":"Interavia Airlines"
        },
        {
            "iata":"ZB",
            "name":"Monarch Airlines"
        },
        {
            "iata":"ZE",
            "name":"Lineas Azteca"
        },
        {
            "iata":"ZF",
            "name":"Athens Airways"
        },
        {
            "iata":"ZH",
            "name":"Shenzhen Airlines"
        },
        {
            "iata":"ZI",
            "name":"Aigle Azur"
        },
        {
            "iata":"ZJ",
            "name":"Zambezi airlines"
        },
        {
            "iata":"ZK",
            "name":"Great Lakes Aviation"
        },
        {
            "iata":"ZL",
            "name":"Regional Express"
        },
        {
            "iata":"ZN",
            "name":"NAYSA"
        },
        {
            "iata":"ZO",
            "name":"Central Air Transport Services (CATS)"
        },
        {
            "iata":"ZU",
            "name":"Bashkortostan Air"
        },
        {
            "iata":"ZV",
            "name":"Zagros Airlines"
        },
        {
            "iata":"ZY",
            "name":"Sky Airlines"
        }
    ];

	return this;
});
