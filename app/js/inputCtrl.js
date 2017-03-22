sunnyExpressApp.controller('InputCtrl', function ($scope, SunnyExpress) {

	//Home page text of welcome
	$scope.welcomingTxt = SunnyExpress.getWelcomingTxt();
	$scope.welcomingTitle = SunnyExpress.getWelcomingTitle();

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


	$scope.statesDicc = {"0": "none", "1": "green", "2": "red"};
	$scope.states = {"0": 0,"1": 0,"2": 0,"3": 0};
	$scope.icons = ["day", "mostly-cloudy", "rain", "snowshowers"];

	$scope.incrementCounter = function(state) {
		$scope.states[state] = ++$scope.states[state]%3;
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

	/**
	 * Save input data to model
	 */
	$scope.search = function() {
		SunnyExpress.setDepartCity($scope.selectedCity);
		SunnyExpress.setArriveCountry($scope.selectedCountry.display);
		SunnyExpress.setDepartDate($scope.departureDate);
		SunnyExpress.setReturnDate($scope.returnDate);
		SunnyExpress.setMinTemperature($scope.minTemperature);
		SunnyExpress.setMaxTemperature($scope.maxTemperature);

		SunnyExpress.setMapCenter();
		SunnyExpress.setMapInfo();
	}
});