sunnyExpressApp.controller('ProfileCtrl', function ($scope, $location, SunnyExpress) {

	$scope.testAfterLogout = function() {
		if(!SunnyExpress.getIsLoggedIn() && $location.path().includes("profile")) {
			$location.path("/home");
		} 
	};

	$scope.getProfile = function() {
		return SunnyExpress.getProfile();
	};

	$scope.getUsername = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().username;
	};

	$scope.getEmail = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().email;
	};

	$scope.getGender = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().gender;
	};

	$scope.getImageSrc = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().image_src;
	};

	$scope.getLanguage = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().language;
	};

	$scope.getGivenName = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().givenname;
	};

	$scope.getFamilyName = function() {
		if(SunnyExpress.getProfile() == undefined) return;
		else return SunnyExpress.getProfile().familyname;
	};
});