sunnyExpressApp.controller('LoadingCtrl', function ($scope, $rootScope,$mdDialog, $interval, SunnyExpress) {

	$rootScope.$on("loadingEvent",function(ev, isOn) {
		if(isOn) {
			$mdDialog.show({
			  contentElement: '#loadingDialog',
			  parent: angular.element(document.body),
			  targetEvent: ev
			});
		}
		else {
			$mdDialog.hide();
		}
	});
});