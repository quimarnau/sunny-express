sunnyExpressApp.controller('MapCtrl', function ($scope, SunnyExpress) {

    $scope.mapConditionIdName = {
        1000: "sunny",
        1006: "cloudy",
        1189: "rain",
        1219: "snow"
    };

    $scope.iconPath = '../images/icons-map/';
    $scope.ext = '.png';

    $scope.mapFeatures = SunnyExpress.getMapFeatures();
    $scope.getCityCoords = function() {
        var activeCities = SunnyExpress.getActiveCities();
        $scope.cityInfo = activeCities;
        console.log($scope.cityInfo);
        /*for (var i = 0; i < activeCities.length; ++i) {
            var maxTemp = undefined;
            var minTemp = undefined;
            for (var j = 0;  j < activeCities[i].forecast.length; ++j) {
                if (minTemp == undefined || activeCities[i].forecast[j].day.mintemp_c < minTemp)
                    minTemp = activeCities[i].forecast[j].day.mintemp_c;
                if (maxTemp == undefined || activeCities[i].forecast[j].day.maxtemp_c > maxTemp)
                    maxTemp = activeCities[i].forecast[j].day.maxtemp_c;
            }
            $scope.cityInfo[activeCities[i].name] = {maxtemp: maxTemp, mintemp: minTemp};
        }*/
        return activeCities;
    };

    $scope.marker = {
        events: {
        mouseover: function(marker, eventName, args) {
            $scope.infoWindow.coords = this.coords;
            $scope.infoWindow.showInfo = true;
            $scope.infoWindow.cityName = this.idKey;
            $scope.infoWindow.imageSrc = this.icon.url.toString();
            $scope.infoWindow.weatherResumeMin = $scope.cityInfo[this.idKey].mintemp + 'ºC';
            $scope.infoWindow.weatherResumeMax = $scope.cityInfo[this.idKey].maxtemp + 'ºC';
            SunnyExpress.setSelectedCity($scope.infoWindow.cityName);
        }
    },
        icon: {
            url:    "../images/cloud-green.png",
            size: new google.maps.Size(10, 55)
        }
    };

    $scope.infoWindow = {
        coords: { latitude: 48.856461, longitude: 2.35236 },
        showInfo: false,
        imageSrc: "../images/cloud-green.png"
    };

    $scope.onCloseInfoWindow = function() {
        $scope.infoWindow.showInfo = false;
        SunnyExpress.setSelectedCity(undefined);
    };

    $scope.onload = function () {
        //console.log($scope.marker.icon);
    }

    function callback(results, status) {
        console.log(results);
    }

    $scope.closeInfoWin = function () {
        $scope.infoWindow.showInfo = false;
    };

});
