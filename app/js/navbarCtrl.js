sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, SunnyExpress) {

	$scope.currentNavItem = $location.path();

	$scope.selectedCity = SunnyExpress.getSelectedCity() != undefined ? SunnyExpress.getSelectedCity().toLowerCase() : undefined;
	$scope.isDescription = $location.path().includes("description");

	$scope.goTo = function (path) {
		if(path.includes("description")) {
			return;
		}
  		$scope.currentNavItem = $location.path(path);
  	};
});