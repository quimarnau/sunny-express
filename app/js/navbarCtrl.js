sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, $rootScope, $route, SunnyExpress) {

	$scope.currentNavItem = $location.path();
	$scope.selectedCity = SunnyExpress.getSelectedCity() != undefined ? SunnyExpress.getSelectedCity().toLowerCase() : undefined;
	$scope.isDescription = $location.path().includes("description");

	$scope.isLogin = function() {
		return this.currentNavItem == '/login';
	};

	$scope.goTo = function(path) {
		if (path.includes("description")) {
			return;
		}
		$scope.currentNavItem = $location.path(path);
	};

	$scope.isLoggedIn = function() {
		return SunnyExpress.getIsLoggedIn();
	};

	$scope.logout = function() {
		$rootScope.$broadcast("event:google-plus-signin-failure",false);
	};

	$scope.$on('event:google-plus-signin-success', function (event, authResult) {
		$rootScope.$broadcast("loadingEvent", true);
		gapi.client.load('plus', 'v1', apiClientLoaded);
	});

	function apiClientLoaded() {
		gapi.client.plus.people.get({userId: 'me'}).execute(handleResponse);
	}

	function handleResponse(resp) {
		SunnyExpress.setIsLoggedIn(true);
		SunnyExpress.setUserId(resp.id);
		SunnyExpress.backendGetTrips.get({"userId": SunnyExpress.getUserId()}, function(data) {
			for(tripId in data.data) {
				data.data[tripId].start = new Date(data.data[tripId].start);
				data.data[tripId].end = new Date(data.data[tripId].end);
			}
			SunnyExpress.setTrips(data.data);
			$rootScope.$broadcast("loadingEvent",false);
		});
	}

	$scope.$on('event:google-plus-signin-failure', function (event, authResult) {
		if ($scope.isLoggedIn()) {
			SunnyExpress.setIsLoggedIn(false);
			SunnyExpress.setUserId(undefined);
			SunnyExpress.setTrips({});
			$location.path('/home');
			$route.reload(); // Not working right now
		}
	});
});
