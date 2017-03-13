var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute','ngResource','ngMaterial']);

sunnyExpressApp.config(['$routeProvider',
	function($routeProvider) {
        $routeProvider.
        when('/search', {
        	templateUrl: 'partials/search.html'
        }).
        otherwise({
            redirectTo: '/search'
      });
  }]);