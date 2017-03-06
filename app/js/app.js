var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute','ngResource']);


sunnyExpressApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home', {
        templateUrl: 'partials/home.html'
      }).
      otherwise({
        redirectTo: '/home'
      });
  }]);