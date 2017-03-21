/**
 * TODO: Replace loadCities and loadCountries by functions of the model
 * TODO:
 */
sunnyExpressApp.controller('InputCtrl', function ($scope, SunnyExpress) {

	//Home page text of welcome
	$scope.welcomingTxt = SunnyExpress.getWelcomingTxt();
	$scope.welcomingTitle = SunnyExpress.getWelcomingTitle();

	$scope.selectedCity    = null;
	$scope.selectedCountry = null;

	$scope.searchCity      = null;
	$scope.searchCountry   = null;

	$scope.cities          = loadCities();
	$scope.countries       = loadCountries();

	$scope.queryCities     = queryCities;
	$scope.queryCountries  = queryCountries;

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

	$scope.setMinTemperature = function(temperature) {
		SunnyExpress.setMinTemperature(temperature);
	}

	$scope.getMinTemperature = function() {
		return SunnyExpress.getMinTemperature();
	}

	$scope.returnDateRangeUpdate = function() {
		if ($scope.departureDate.getTime() >= $scope.returnDate.getTime()) {
			$scope.returnDate = new Date($scope.departureDate.getTime());
			$scope.returnDate.setDate($scope.departureDate.getDate() + 1);
			$scope.minReturnDate = new Date($scope.departureDate.getTime());
			$scope.minReturnDate.setDate($scope.departureDate.getDate() + 1);
		}
	}

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