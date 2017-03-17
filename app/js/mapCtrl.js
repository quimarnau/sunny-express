/**
 * Created by aleixsacrest on 17/03/2017.
 */

var map;

function initMap() {
    alert('hholaa');
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7413549, lng: -73.9980244},
        zoom: 13,
        mapTypeControl: false
    });
}

sunnyExpressApp.controller('MapCtrl', function ($scope, SunnyExpress) {



});
