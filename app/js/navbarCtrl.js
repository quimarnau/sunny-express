sunnyExpressApp.controller('NavbarCtrl', function ($scope, $location, SunnyExpress) {

	$scope.currentNavItem = 'home';

	$scope.goTo = function (path) {
  		$location.path(path);
  	};
});