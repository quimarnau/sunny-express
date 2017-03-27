/**
 * Created by aleixsacrest on 14/03/2017.
 */

sunnyExpressApp.controller('DescriptionCtrl', function ($scope, $location, SunnyExpress) {

    $scope.getDepartCity = function() {
        return SunnyExpress.getDepartCity();
    }

    $scope.getArriveCity = function() {
        return SunnyExpress.getSelectedCity();
    }

    // $scope.addTrip = function () {

    // 	var departDate = SunnyExpress.getDepartDate();
    // 	var returnDate = SunnyExpress.getReturnDate();
    // 	var departCity = SunnyExpress.getDepartCity();
    // 	var returnCity = SunnyExpress.getSelectedCity();

    // 	var trip = {"start": departDate, "end": returnDate, "departCity": departCity, "arriveCity": returnCity};

    // 	SunnyExpress.addNewTrip(trip);
    // }

    $scope.goToCalendar = function () {
  		$location.path('/calendar');
  	};

});
