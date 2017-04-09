sunnyExpressApp.controller('LoginCtrl', function ($scope, $rootScope, $auth, SunnyExpress) {

	$scope.authenticate = function(provider) {
		$auth.authenticate(provider);
	};






	function onSignIn(googleUser) {
		var profile = googleUser.getBasicProfile();
		console.log('ID: ' + profile.getId());
		console.log('Name: ' + profile.getName());
		console.log('Image URL: ' + profile.getImageUrl());
		console.log('Email: ' + profile.getEmail());
	}


	window.onSignIn = onSignIn;
});
