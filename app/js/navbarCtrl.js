sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, SunnyExpress) {

	$scope.currentNavItem = $location.path();

	$scope.goTo = function (path) {
  		$scope.currentNavItem = $location.path(path);
  	};
});