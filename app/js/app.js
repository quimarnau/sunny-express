/**
 * Angular Material (ngMaterial) used in search view, as well as ngMessages
 * @type {angular.Module} Main module of sunny express app
 */
var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute', 'ngResource', 'ngMaterial', 'ngMessages',
'materialCalendar', 'uiGmapgoogle-maps', 'material.svgAssetsCache', 'directive.g+signin']);

sunnyExpressApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/home', {
				templateUrl: 'partials/home.html'
			}).
			when('/login', {
				templateUrl: 'partials/login.html'
			}).
			when('/search', {
				templateUrl: 'partials/search.html'
			}).
			when('/description/:cityName', {
				templateUrl: 'partials/description.html',
				controller: 'DescriptionCtrl'
			}).
			when('/calendar', {
				templateUrl: 'partials/calendar.html',
				controller: 'CalendarCtrl'
			}).
			otherwise({
				redirectTo: '/home'
			});
	}
]);
