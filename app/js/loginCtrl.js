sunnyExpressApp.controller('LoginCtrl', function ($scope, SunnyExpress) {
	$scope.$on('event:google-plus-signin-success', function (event, authResult) {
		// Send login to server or save into cookie
	});
	$scope.$on('event:google-plus-signin-failure', function (event, authResult) {
		// Auth failure or signout detected
	});
});