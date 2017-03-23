sunnyExpressApp.controller('InputCtrl', function ($scope, $location, $q, SunnyExpress) {

	/**
	 * Parameters and functions of location inputs
	 */
	$scope.selectedCity = null;
	$scope.selectedCountry = null;

	$scope.searchCity = null;
	$scope.searchCountry = null;

	$scope.cities = loadCities();
	$scope.countries = loadCountries();

	$scope.queryCities = queryCities;
	$scope.queryCountries = queryCountries;

	/**
	 * Parameters of date pickers
	 */
	$scope.departureDate = new Date();
	$scope.returnDate = new Date($scope.departureDate.getTime());
	$scope.returnDate.setDate($scope.departureDate.getDate() + 1);

	$scope.minDepartureDate = new Date($scope.departureDate.getTime());
	$scope.minReturnDate = new Date($scope.returnDate.getTime());

	$scope.maxReturnDate = new Date($scope.minDepartureDate.getTime());
	$scope.maxReturnDate.setDate($scope.minDepartureDate.getDate() + 9);
	$scope.maxDepartureDate = new Date($scope.maxReturnDate.getTime());
	$scope.maxDepartureDate.setDate($scope.maxReturnDate.getDate() - 1);

	$scope.minTemperature  = SunnyExpress.getMinTemperature();
	$scope.maxTemperature  = SunnyExpress.getMaxTemperature();

	/**
	 * Parameters of weather conditions
	 */
	$scope.statesDicc = {"0": "none", "1": "green", "2": "red"};
	$scope.states = [0, 0, 0, 0];
	$scope.icons = ["day", "mostly-cloudy", "rain", "snowshowers"];

	/**
	 * Increment the icon counter
	 * @param state Index of icon counter
	 */
	$scope.incrementCounter = function(index) {
		$scope.states[index] = ++$scope.states[index]%3;
	}

	/**
	 * Gather desired and undesired weather
	 */
	var getWeatherConditions = function() {
		var desired = [];
		var undesired = [];
		var conditions = SunnyExpress.getBaseConditions();
		for (var i = 0; i < $scope.states.length; i++) {
			if ($scope.states[i] == 1) {
				desired.push(conditions[i]);
			}
			else if ($scope.states[i] == 2) {
				undesired.push(conditions[i]);
			}
		}
		return {
			desired: desired,
			undesired: undesired
		};
	}

	/**
	 * Make return date posterior to departure date
	 */
	$scope.returnDateRangeUpdate = function() {
		if ($scope.departureDate.getTime() >= $scope.returnDate.getTime()) {
			$scope.returnDate = new Date($scope.departureDate.getTime());
			$scope.returnDate.setDate($scope.departureDate.getDate() + 1);
			$scope.minReturnDate = new Date($scope.departureDate.getTime());
			$scope.minReturnDate.setDate($scope.departureDate.getDate() + 1);
		}
	}

	/**
	 * Build cities list of key/value pairs
	 */
	function loadCities() {
		return SunnyExpress.getCities().map( function (city) {
			return {
				value: city.toLowerCase(),
				display: city
			};
		});
	}

	/**
	 * Build countries list of key/value pairs
	 */
	function loadCountries() {
		return SunnyExpress.getCountries().map( function (country) {
			return {
				value: country.toLowerCase(),
				display: country
			};
		});
	}

	/**
	 * Search for city
	 */
	function queryCities (query) {
		return query ? $scope.cities.filter( createFilterFor(query) ) : $scope.cities;
	}

	/**
	 * Search for country
	 */
	function queryCountries (query) {
		return query ? $scope.countries.filter( createFilterFor(query) ) : $scope.countries;
	}

	/**
	 * Create filter function for a query string
	 */
	function createFilterFor(query) {
		var lowercaseQuery = angular.lowercase(query);

		return function filterFn(item) {
			return (item.value.indexOf(lowercaseQuery) === 0);
		};
	}

	var searchWeatherCity = function(numDays, city) {
		var d = $q.defer();
		var result = SunnyExpress.getCityWeather.get({days: numDays, q: city.lat + "," + city.lon}, function() {
			d.resolve(result);
		});

		return d.promise;
	}

	var searchWeather = function() {
		//TODO show loading picture
		
		var numDays = Math.round(($scope.returnDate-$scope.departureDate)/(1000*60*60*24));
		var cities = SunnyExpress.getCountryCities($scope.selectedCountry.display);
		var cityQueue = [];

		for (var i = 0; i < cities.length; i++) {
			cityQueue.push(searchWeatherCity(numDays,cities[i]));
		};

		$q.all(cityQueue).then(function(data) {
			SunnyExpress.setWeatherActiveCities(data);
		})
	}

	/**
	 * Save input data to model
	 */
	$scope.search = function() {
		SunnyExpress.setDepartCity($scope.selectedCity.display);
		SunnyExpress.setArriveCountry($scope.selectedCountry.display);
		SunnyExpress.setDepartDate($scope.departureDate);
		SunnyExpress.setReturnDate($scope.returnDate);
		SunnyExpress.setMinTemperature($scope.minTemperature);
		SunnyExpress.setMaxTemperature($scope.maxTemperature);

		var weatherConditions = getWeatherConditions();
		SunnyExpress.setFavourableWeatherConditions(weatherConditions.desired);
		SunnyExpress.setDisfavourableWeatherConditions(weatherConditions.undesired);
		
		searchWeather();

        SunnyExpress.setCityCoords();
        SunnyExpress.setMapCenter();
        console.log(SunnyExpress.getActiveCities());
	}

	/**
	 * Change from home view to search view
	 */
	 $scope.goToSearch = function () {
  		$location.path('/search');
  	};
});