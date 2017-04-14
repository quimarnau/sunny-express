sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, $rootScope, $window, $timeout, $cookies, SunnyExpress) {
	var isClickSent = false;
	$scope.currentNavItem = $location.path();
	$scope.selectedCity = SunnyExpress.getSelectedCity() != undefined ? SunnyExpress.getSelectedCity() : undefined;
	$scope.isDescription = $location.path().includes("description");

	$scope.isLoginSelected = function() {
		return this.currentNavItem == '/login';
	};

	$scope.setIsLoginClicked = function() {
		SunnyExpress.setIsLoginClicked(true);

		// This is only needed because of a known bug with Mozilla Firefox browser.
		// Mozilla does not propagate click event to an element`s children, so we have to trigger it.
		// Browsers like Opera, Safari, Chrome support this.
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

		var url = resp.image.url.replace('sz=50', 'sz=200');
		var gender = resp.gender != undefined?
			resp.gender.charAt(0).toUpperCase() + resp.gender.slice(1):
			"Undefined";
		var language = resp.language != undefined?
			resp.language.charAt(0).toUpperCase() + resp.language.slice(1):
			"Unknown";

		var profile = {
			"username": resp.displayName,
			"email": resp.emails[0].value,
			"gender": gender,
			"image_src": url,
			"language": language,
			"givenname": resp.name.givenName,
			"familyname": resp.name.familyName
		};

		SunnyExpress.setProfile(profile);

		$rootScope.$broadcast("loadingEvent",false);

		if ($location.path() == "/calendar") {
				$rootScope.$broadcast("reload", true);
		}
	}

	$scope.$on('event:google-plus-signin-failure', function (event, authResult) {
		if ($scope.isLoggedIn()) {
			SunnyExpress.setIsLoggedIn(false);
			SunnyExpress.setUserId(undefined);
			SunnyExpress.setTrips({});
			$rootScope.$broadcast("reload", true);

		}
	});

	$rootScope.$on('reload', function (event, bool) {
		$window.location.reload();
	});
});
