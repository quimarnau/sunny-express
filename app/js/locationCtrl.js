/**
 * TODO: reuse code and instead of having 2 functions queryCities, queryCountries build 1 querySearch
 * TODO: show suggestions on black entry
 */
sunnyExpressApp.controller('LocationCtrl', function () {

	// list of cities and countries value/display objects
	this.cities          = loadCities();
	this.countries       = loadCountries();

	this.selectedCity    = null;
	this.selectedCountry = null;

	this.searchCity      = null;
	this.searchCountry   = null;

	this.queryCities     = queryCities;
	this.queryCountries  = queryCountries;

	/**
	 * Search for city
	 */
	function queryCities (query) {
		var results = query ? this.cities.filter( createFilterFor(query) ) : this.cities;
		return results;
	}

	/**
	 * Search for country
	 */
	function queryCountries (query) {
		var results = query ? this.countries.filter( createFilterFor(query) ) : this.countries;
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