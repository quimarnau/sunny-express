sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, SunnyExpress) {

	$scope.currentNavItem = $location.path();
	$scope.selectedCity = SunnyExpress.getSelectedCity() != undefined ? SunnyExpress.getSelectedCity().toLowerCase() : undefined;
	$scope.isDescription = $location.path().includes("description");
	$scope.isLogin = $location.path().includes("login");

	$scope.isLoggedIn = function() {
		return SunnyExpress.getIsLoggedIn();
	}

	$scope.goTo = function (path) {
		if(path.includes("description")) {
			return;
		}
  		$scope.currentNavItem = $location.path(path);
  	};


});