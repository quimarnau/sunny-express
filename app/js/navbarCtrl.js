sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, SunnyExpress) {

	$scope.currentNavItem = SunnyExpress.getCurrentNavItem();

	$scope.goTo = function (path) {
  		$location.path(path);
  		SunnyExpress.setCurrentNavItem($scope.currentNavItem);
  	};
});