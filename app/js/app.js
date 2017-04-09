/**
 * Angular Material (ngMaterial) used in search view, as well as ngMessages
 * @type {angular.Module} Main module of sunny express app
 */
var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute', 'ngResource', 'ngMaterial', 'ngMessages',
'materialCalendar', 'uiGmapgoogle-maps', 'material.svgAssetsCache', 'directive.g+signin'])
	.config(['$routeProvider', function($routeProvider){
		$routeProvider.accessWhen = function(path, route){
			route.resolve = {
				countries: function(SunnyExpress) {
					return SunnyExpress.backendGetCountries.query().$promise.then(function(data){
						return data;
					});
				},
				cities: function(SunnyExpress) {
					return SunnyExpress.backendGetCities.query().$promise.then(function(data){
						return data;
					});
				},
				baseConditions: function(SunnyExpress) {
					return SunnyExpress.backendGetBaseConditions.query().$promise.then(function(data){
						return data;
					});
				},
				aggregateConditions: function(SunnyExpress) {
					return SunnyExpress.backendGetAggregateConditions.get().$promise.then(function(data){
						return data;
					});
				},
				iataCodesAirlines: function(SunnyExpress) {
					return SunnyExpress.backendGetIataCodesAirlines.query().$promise.then(function(data){
						return data;
					});
				}
			}
			return $routeProvider.when(path, route);
		  };   
   }]);

sunnyExpressApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			accessWhen('/home', {
				templateUrl: 'partials/home.html'
			}).
			accessWhen('/search', {
				templateUrl: 'partials/search.html'
			}).
			accessWhen('/description/:cityName', {
				templateUrl: 'partials/description.html',
				controller: 'DescriptionCtrl'
			}).
			accessWhen('/calendar', {
				templateUrl: 'partials/calendar.html',
				controller: 'CalendarCtrl'
			}).
			otherwise({
				redirectTo: '/home'
			});
	}
]);
