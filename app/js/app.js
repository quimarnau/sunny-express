var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute','ngResource','ngMaterial']);

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
      		otherwise({
        		redirectTo: '/home'
      		});
  	}
]);
