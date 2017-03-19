/**
 * Angular Material (ngMaterial) used in search view, as well as ngMessages
 * @type {angular.Module} Main module of sunny express app
 */
var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute', 'ngResource', 'ngMaterial', 'ngMessages']);

sunnyExpressApp.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.
			when('/home', {
				templateUrl: 'partials/home.html',
				controller: 'TestCtrl'
			}).
			when('/search', {
				templateUrl: 'partials/search.html'
			}).
			when('/description', {
				templateUrl: 'partials/description.html',
				controller: 'DescriptionCtrl'
			}).
			otherwise({
				redirectTo: '/home'
			});
	}
]);
