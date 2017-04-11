sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, $rootScope, $window, $timeout, $cookies, SunnyExpress) {
	var isClickSent = false;
	$scope.currentNavItem = $location.path();
	$scope.selectedCity = SunnyExpress.getSelectedCity() != undefined ? SunnyExpress.getSelectedCity().toLowerCase() : undefined;
	$scope.isDescription = $location.path().includes("description");

	$scope.isLoginSelected = function() {
		return this.currentNavItem == '/login';
	};

	$scope.setIsLoginClicked = function() {
		SunnyExpress.setIsLoginClicked(true);
		if(!isClickSent) {
			$timeout(function() {
				isClickSent = true;
				angular.element("#login-button").trigger("click");
			});
		}
	};

	$scope.isLoginClicked = function() {
		SunnyExpress.getIsLoginClicked();
	}

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
		$rootScope.$broadcast("event:google-plus-signin-failure", false);
	};

	$scope.$on('event:google-plus-signin-success', function (event, authResult) {
		if (SunnyExpress.getIsLoginClicked()) {
			$rootScope.$broadcast("loadingEvent", true);
			gapi.client.load('plus', 'v1', apiClientLoaded);
		}
	});

	function apiClientLoaded() {
		gapi.client.plus.people.get({userId: 'me'}).execute(handleResponse);
	}

	function handleResponse(resp) {
		SunnyExpress.setIsLoggedIn(true);
		SunnyExpress.setUserId(resp.id);
		console.log(resp);

		var url = resp.image.url;

		var profile = {
			"username": resp.displayName,
			"email": resp.emails[0],
			"gender": resp.gender,
			"image_src": resp.image.url,
			"language": resp.language,
			"givenname": resp.givenName,
			"familyname": resp.name.familyName
		};

		SunnyExpress.setProfile(profile);

		SunnyExpress.backendGetTrips.get({"userId": SunnyExpress.getUserId()}, function(data) {
			for(tripId in data.data) {
				data.data[tripId].start = new Date(data.data[tripId].start);
				data.data[tripId].end = new Date(data.data[tripId].end);
			}
			SunnyExpress.setTrips(data.data);
			$rootScope.$broadcast("loadingEvent",false);

			if ($location.path() == "/calendar") {
				$rootScope.$broadcast("reload", true);
			}
		});
	}

	$scope.$on('event:google-plus-signin-failure', function (event, authResult) {
		if ($scope.isLoggedIn()) {
			SunnyExpress.setIsLoggedIn(false);
			SunnyExpress.setUserId(undefined);
			SunnyExpress.setTrips({});
			$location.path('/home');
			$rootScope.$broadcast("reload", true);

		}
	});

	$rootScope.$on('reload', function (event, bool) {
		$window.location.reload();
	});
});
