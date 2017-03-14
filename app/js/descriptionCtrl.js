/**
 * Created by aleixsacrest on 14/03/2017.
 */

sunnyExpressApp.controller('DescriptionCtrl', function ($scope, SunnyExpress) {

    $scope.getDepartCity = function() {
        return SunnyExpress.getDepartCity();
    }

    $scope.getArriveCity = function() {
        return 'Paris';
        return Sunnyexpress.getArriveCity();
    }


});
