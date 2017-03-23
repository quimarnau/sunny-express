sunnyExpressApp.controller('MapCtrl', function ($scope, SunnyExpress) {

    $scope.mapConditionIdName = {
        1000: "sunny",
        1006: "cloudy",
        1189: "rain",
        1219: "snow"
    };

    $scope.iconPath = '../images/icons-map/';
    $scope.ext = '.png';

    $scope.icons = ["day", "mostly-cloudy", "rain", "snowshowers"];

    $scope.mapFeatures = SunnyExpress.getMapFeatures();
    $scope.getCityCoords = function() {
        return SunnyExpress.getActiveCities();
    };

    $scope.marker = {
        events: {
        mouseover: function(marker, eventName, args) {
            $scope.infoWindow.coords = this.coords;
            $scope.infoWindow.showInfo = true;
            $scope.infoWindow.cityName = this.idKey;
            $scope.infoWindow.weatherResume = 'here info about the city will be displayed';
        }
    },
        icon: {
            url:    "../images/cloud-green.png",
            size: new google.maps.Size(10, 55)
        }
    };

    $scope.infoWindow = {
        coords: { latitude: 48.856461, longitude: 2.35236 },
        showInfo: false
    };

    $scope.onCloseInfoWindow = function() {
        $scope.infoWindow.showInfo = false;
    };

    /*var map;
    var markers = [];*/

    $scope.onload = function () {
        //console.log($scope.marker.icon);
    }

    function callback(results, status) {
        console.log(results);
    }

});
