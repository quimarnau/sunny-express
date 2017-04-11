sunnyExpressApp.controller('ProfileCtrl', function ($scope, SunnyExpress) {

	$scope.getProfile = function() {
		return SunnyExpress.getProfile();
	};

	$scope.getUsername = function() {
		return SunnyExpress.getProfile().username;
	};

	$scope.getEmail = function() {
		return SunnyExpress.getProfile().email;
	};

	$scope.getGender = function() {
		return SunnyExpress.getProfile().gender;
	};

	$scope.getImageSrc = function() {
		return SunnyExpress.getProfile().image_src;
	};

	$scope.getLanguage = function() {
		return SunnyExpress.getProfile().language;
	};

	$scope.getGivenName = function() {
		return SunnyExpress.getProfile().givenname;
	};

	$scope.getFamilyName = function() {
		return SunnyExpress.getProfile().familyname;
	};
});