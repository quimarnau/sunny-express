sunnyExpressApp.controller('ProfileCtrl', function ($scope, SunnyExpress) {

	$scope.getProfile = function() {
		console.log(SunnyExpress.getProfile());
		return SunnyExpress.getProfile();
	};

	$scope.getImageSrc = function() {
		console.log(SunnyExpress.getProfile().image_src)
		return SunnyExpress.getProfile().image_src;
	};

	$scope.getUsername = function() {
		return SunnyExpress.getProfile().username;
	};


});