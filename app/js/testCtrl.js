sunnyExpressApp.controller('TestCtrl', function($scope, SunnyExpress) {
	
	SunnyExpress.setDepartCity('Stockholm');
	SunnyExpress.log(SunnyExpress.getDepartCity());
});