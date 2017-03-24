sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, SunnyExpress) {

	$scope.currentNavItem = 'page1';

	$scope.goTo = function (path) {
  		$location.path(path);
  	};
});