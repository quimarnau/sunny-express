var sunnyExpressApp = angular.module('sunnyExpress', ['ngRoute', 'ngResource', 'ngMaterial', 'ngMessages',
'materialCalendar', 'uiGmapgoogle-maps', 'material.svgAssetsCache', 'directive.g+signin', 'ngCookies'])
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
				},
				mapConditionIdName: function(SunnyExpress) {
					return SunnyExpress.backendGetMapConditionIdName.get().$promise.then(function(data){
						return data;
					});
				},
				trips: function(SunnyExpress, $q) {
					if (SunnyExpress.getIsLoggedIn()) {
						return SunnyExpress.backendGetTrips.get({"userId": SunnyExpress.getUserId()}).$promise.then(function(data) {
							for(tripId in data.data) {
								data.data[tripId].start = new Date(data.data[tripId].start);
								data.data[tripId].end = new Date(data.data[tripId].end);
								data.data[tripId].updateDate = new Date(data.data[tripId].updateDate);
							}
							return data.data;
						});
					}
					else {
						return $q.resolve(0);
					}
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
			accessWhen('/profile', {
				templateUrl: 'partials/profile.html',
			}).
			otherwise({
				redirectTo: '/home'
			});
	}
]);
