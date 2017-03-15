sunnyExpressApp.controller('InputCtrl', function ($scope, SunnyExpress) {

	$scope.minTemperature = SunnyExpress.getMinTemperature();
	$scope.maxTemperature = SunnyExpress.getMaxTemperature();


	$scope.setMinTemperature = function(temperature) {
		SunnyExpress.setMinTemperature(temperature);
	}

	$scope.getMinTemperature = function() {
		return SunnyExpress.getMinTemperature();
	}

});