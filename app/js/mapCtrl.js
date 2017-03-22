sunnyExpressApp.controller('MapCtrl', function ($scope, SunnyExpress) {

    $scope.mapFeatures = SunnyExpress.getMapFeatures();
    $scope.getCityCoords = function() {
        return SunnyExpress.getCityCoords();
    };

    $scope.marker = {events: {
        mouseover: function(marker, eventName, args) {
            $scope.infoWindow.coords = this.coords;
            $scope.infoWindow.showInfo = true;
            $scope.infoWindow.cityName = this.idKey;
            $scope.infoWindow.weatherResume = 'here info about the city will be displayed';
        }
    }};

    $scope.infoWindow = {
        coords: { latitude: 48.856461, longitude: 2.35236 },
        showInfo: false
    };

    $scope.onCloseInfoWindow = function() {
        $scope.infoWindow.showInfo = false;
    };

    /*var map;
    var markers = [];

    $scope.onload = function () {
        var activeCity = {"name": "Paris", "lng":2.35236,"lat":48.856461};
        var activeCityLocation = new google.maps.LatLng(activeCity.lat, activeCity.lng);
        // Constructor creates a new map - only center and zoom are required.

        var mapElement = document.getElementById('map');

        SunnyExpress.setMap(mapElement);



        var request = {
            location: activeCityLocation,
            radius: '5000'
        };

        //service = new google.maps.places.PlacesService(map);
        //service.nearbySearch(request, callback);
    }*/

    function callback(results, status) {
        console.log(results);
    }

});
