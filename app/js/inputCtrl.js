sunnyExpressApp.controller('InputCtrl', function ($scope, $location, $q, $rootScope, $mdDialog, $window, SunnyExpress) {

	/**
	 * Parameters and functions of location inputs
	 */

	if(SunnyExpress.getCities() == undefined) SunnyExpress.setCities($scope.$parent.$resolve.cities) ;
	if(SunnyExpress.getCountries() == undefined) SunnyExpress.setCountries($scope.$parent.$resolve.countries);
	if(SunnyExpress.getBaseConditions() == undefined) SunnyExpress.setBaseConditions($scope.$parent.$resolve.baseConditions);
	if(SunnyExpress.getAggregateConditions() == undefined) SunnyExpress.setAggregateConditions($scope.$parent.$resolve.aggregateConditions);
	if(SunnyExpress.getIataCodesAirlines() == undefined) SunnyExpress.setIataCodesAirlines($scope.$parent.$resolve.iataCodesAirlines);
	if(SunnyExpress.getMapConditionIdName() == undefined) SunnyExpress.setMapConditionIdName($scope.$parent.$resolve.mapConditionIdName);

	$scope.selectedCity = SunnyExpress.getDepartCity() != undefined ? {
		display: SunnyExpress.getDepartCity(),
		value: SunnyExpress.getDepartCity().toLowerCase() }
		: null;
	$scope.selectedCountry = SunnyExpress.getArriveCountry() != undefined ? {
		display: SunnyExpress.getArriveCountry(),
		value: SunnyExpress.getArriveCountry().toLowerCase()}
		: null;

	$scope.searchCity = null;
	$scope.searchCountry = null;

	$scope.cities = loadCities();
	$scope.countries = loadCountries();

	$scope.queryCities = queryCities;
	$scope.queryCountries = queryCountries;

	$rootScope.searchPerformed = false;

	/**
	 * Parameters of date pickers
	 */
	$(function() {
		$scope.departureDate = SunnyExpress.getDepartDate() != undefined ? SunnyExpress.getDepartDate() : new Date();
		$scope.returnDate = SunnyExpress.getReturnDate();
		if ($scope.returnDate == undefined) {
			$scope.returnDate = new Date($scope.departureDate.getTime());
			$scope.returnDate.setDate($scope.departureDate.getDate() + 1);
		}

		$scope.minDepartureDate = new Date();
		$scope.minReturnDate = new Date($scope.minDepartureDate.getTime());
		$scope.minReturnDate.setDate($scope.minDepartureDate.getDate() + 1)

		$scope.maxReturnDate = new Date($scope.minDepartureDate.getTime());
		$scope.maxReturnDate.setDate($scope.minDepartureDate.getDate() + 9);
		$scope.maxDepartureDate = new Date($scope.maxReturnDate.getTime());
		$scope.maxDepartureDate.setDate($scope.maxReturnDate.getDate() - 1);

		$scope.minTemperature = SunnyExpress.getMinTemperature();
		$scope.maxTemperature = SunnyExpress.getMaxTemperature();
	});

	/**
	 * Parameters of weather conditions
	 */
	$scope.statesDicc = {"0": "none", "1": "var(--validation-green)", "2": "var(--rejection-red)"};
	$scope.iconsName = ["day", "mostly-cloudy", "rain", "snowshowers"];
	$scope.iconsState = SunnyExpress.getIconsState();
	$scope.careAboutWind = SunnyExpress.getWindPreference() ? true : false;
	$scope.windPreference = SunnyExpress.getWindPreference() ? SunnyExpress.getWindPreference() : -1;

	/**
	 * Increment the icon counter
	 * @param state Index of icon counter
	 */
	$scope.incrementCounter = function(index) {
		$scope.iconsState[index] = ++$scope.iconsState[index]%3;
	}

	/**
	 * Gather desired and undesired weather
	 */
	var getWeatherConditions = function() {
		var desired = [];
		var undesired = [];
		var conditions = SunnyExpress.getBaseConditions();
		for (var i = 0; i < $scope.iconsState.length; i++) {
			if ($scope.iconsState[i] == 1) {
				desired.push(conditions[i]);
			}
			else if ($scope.iconsState[i] == 2) {
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

	var setWindPreference = function() {
		if ($scope.careAboutWind && $scope.windPreference == 1) return 1;
		else if ($scope.careAboutWind && $scope.windPreference == -1) return -1;
		else return 0;
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
		SunnyExpress.setIconsState($scope.iconsState);
		SunnyExpress.setWindPreference(setWindPreference());

		var weatherConditions = getWeatherConditions();
		SunnyExpress.setFavourableWeatherConditions(weatherConditions.desired);
		SunnyExpress.setDisfavourableWeatherConditions(weatherConditions.undesired);

		$rootScope.$broadcast("loadingEvent",true);
		SunnyExpress.searchWeather(function() {
			$rootScope.searchPerformed = true;
			$rootScope.$broadcast("loadingEvent",false);
		});

        SunnyExpress.setMapCenter();
	}

	/**
	 * Change from home view to search view
	 */
	 $scope.goToSearch = function () {
  		$location.path('/search');
  	};

  	/**
	 * Display help instruction
	 */

	 var help = {
	      templateUrl: 'partials/help.html',
	      clickOutsideToClose:true
	    }

	 $scope.helpDisplay = function () {
  		$mdDialog.show(help);
	  };
});
