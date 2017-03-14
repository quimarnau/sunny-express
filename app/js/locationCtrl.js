/**
 * TODO: reuse code and instead of having 2 functions queryCities, queryCountries build 1 querySearch
 */
sunnyExpressApp.controller('LocationCtrl', function () {

	var self = this;

	// list of cities and countries value/display objects
	self.cities          = loadCities();
	self.countries       = loadCountries();

	self.selectedCity    = null;
	self.selectedCountry = null;

	self.searchCity      = null;
	self.searchCountry   = null;

	self.queryCities     = queryCities;
	self.queryCountries  = queryCountries;

	/**
	 * Search for city
	 */
	function queryCities (query) {
		var results = query ? self.cities.filter( createFilterFor(query) ) : self.cities;
		return results;
	}

	/**
	 * Search for country
	 */
	function queryCountries (query) {
		var results = query ? self.countries.filter( createFilterFor(query) ) : self.countries;
		return results;
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
	 * Create filter function for a query string
	 */
	function createFilterFor(query) {
		var lowercaseQuery = angular.lowercase(query);

		return function filterFn(item) {
			return (item.value.indexOf(lowercaseQuery) === 0);
		};

	}
});