sunnyExpressApp.controller('LoginCtrl', function ($scope, $rootScope, SunnyExpress) {
	$scope.$on('event:google-plus-signin-success', function (event, authResult) {
		$rootScope.$broadcast("loadingEvent",true);
		gapi.client.load('plus', 'v1', apiClientLoaded);
    });

    function apiClientLoaded() {
        gapi.client.plus.people.get({userId: 'me'}).execute(handleResponse);
    }

    function handleResponse(resp) {
		SunnyExpress.setIsLoggedIn(true);
		SunnyExpress.setUserId(resp.id);
		SunnyExpress.backendGetTrips.get({"userId": SunnyExpress.getUserId()}, function(data) {
			for(tripId in data.data) {
				data.data[tripId].start = new Date(data.data[tripId].start);
				data.data[tripId].end = new Date(data.data[tripId].end);
			}
			SunnyExpress.setTrips(data.data);
			$rootScope.$broadcast("loadingEvent",false);
		});		
    }

	$scope.$on('event:google-plus-signin-failure', function (event, authResult) {
		SunnyExpress.setIsLoggedIn(false);
		SunnyExpress.setUserId(undefined);
		SunnyExpress.setTrips({});
	});
});
