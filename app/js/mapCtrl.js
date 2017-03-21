sunnyExpressApp.controller('MapCtrl', function ($scope, $window, SunnyExpress) {

    var map;
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
    }

    $scope.$on('pet', function(event, args) {
        alert('hola');
    });

    function callback(results, status) {
        console.log(results);
    }

});
