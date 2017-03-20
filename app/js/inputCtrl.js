/**
 * TODO: Replace loadCities and loadCountries by functions of the model
 * TODO:
 */
sunnyExpressApp.controller('InputCtrl', function ($scope, SunnyExpress) {

	$scope.selectedCity    = null;
	$scope.selectedCountry = null;

	$scope.searchCity      = null;
	$scope.searchCountry   = null;

	$scope.cities          = loadCities();
	$scope.countries       = loadCountries();

	$scope.queryCities     = queryCities;
	$scope.queryCountries  = queryCountries;

	$scope.departureDate = new Date();
	$scope.returnDate = new Date(
		$scope.departureDate.getFullYear(),
		$scope.departureDate.getMonth(),
		$scope.departureDate.getDate() + 1
	);

	$scope.minDepartureDate = $scope.departureDate;
	$scope.minReturnDate = $scope.returnDate;

	$scope.maxReturnDate = new Date(
		$scope.minDepartureDate.getFullYear(),
		$scope.minDepartureDate.getMonth(),
		$scope.minDepartureDate.getDate() + 14
	);
	$scope.maxDepartureDate = new Date(
		$scope.maxReturnDate.getFullYear(),
		$scope.maxReturnDate.getMonth(),
		$scope.maxReturnDate.getDate() - 1
	);

	$scope.minTemperature  = SunnyExpress.getMinTemperature();
	$scope.maxTemperature  = SunnyExpress.getMaxTemperature();

	$scope.setMinTemperature = function(temperature) {
		SunnyExpress.setMinTemperature(temperature);
	}

	$scope.getMinTemperature = function() {
		return SunnyExpress.getMinTemperature();
	}

	$scope.search = function() {
		// TODO: need to discuss when all assertions on input data will be made
		// TODO: not disregard the possibility of removing the search button
		SunnyExpress.setDepartCity($scope.selectedCity);
		SunnyExpress.setArriveCountry($scope.selectedCountry);
		SunnyExpress.setDepartDate($scope.departureDate);
		SunnyExpress.setReturnDate($scope.returnDate);
		SunnyExpress.setMinTemperature($scope.minTemperature);
		SunnyExpress.setMaxTemperature($scope.maxTemperature);

		/*
		console.log("Departure city: " + SunnyExpress.getDepartCity());
		console.log("Arrival country: " + SunnyExpress.getArriveCountry());
		console.log("Depart date:" + SunnyExpress.getDepartDate());
		console.log("Return date:" + SunnyExpress.getReturnDate());
		console.log("Min temp:" + SunnyExpress.getMinTemperature());
		console.log("Max temp:" + SunnyExpress.getMaxTemperature());
		*/
	}

	/**
	 * Build cities list of key/value pairs
	 */
	function loadCities() {
		var allCities = 'Paris, Budapest, Barcelona';

		return allCities.split(/, +/g).map( function (city) {
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
		var allCountries = 'France, Hungary, Spain';

		return allCountries.split(/, +/g).map( function (country) {
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
		var results = query ? $scope.cities.filter( createFilterFor(query) ) : $scope.cities;
		return results;
	}

	/**
	 * Search for country
	 */
	function queryCountries (query) {
		var results = query ? $scope.countries.filter( createFilterFor(query) ) : $scope.countries;
		return results;
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
});