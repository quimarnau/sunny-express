sunnyExpressApp.controller('LoginCtrl', function ($scope, SunnyExpress) {
	$scope.$on('event:google-plus-signin-success', function (event, authResult) {
		gapi.client.load('plus', 'v1', apiClientLoaded);
    });

    function apiClientLoaded() {
    	gapi.client.setApiKey("");
        gapi.client.plus.people.get({userId: 'me'}).execute(handleResponse);
    }

    function handleResponse(resp) {
        console.log(resp);
    }

	$scope.$on('event:google-plus-signin-failure', function (event, authResult) {
		// Auth failure or signout detected
	});
});
