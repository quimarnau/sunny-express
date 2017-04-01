sunnyExpressApp.controller('LoadingCtrl', function ($scope, $rootScope,$mdDialog, $interval, SunnyExpress) {

	$scope.mode = 'query';

	$rootScope.$on("loadingEvent",function(ev, isOn) {
		if(isOn) {
			$mdDialog.show({
			  contentElement: '#myDialog',
			  parent: angular.element(document.body),
			  targetEvent: ev
			});
		}
		else {
			$mdDialog.hide();
		}
	});
});