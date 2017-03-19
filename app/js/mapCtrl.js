var map;

function initMap() {
	var activeCity = {"name": "Paris", "lng":2.35236,"lat":48.856461};
	var activeCityLocation = new google.maps.LatLng(activeCity.lat, activeCity.lng);
	// Constructor creates a new map - only center and zoom are required.

	var mapElement = document.getElementById('map');
	map = new google.maps.Map(mapElement, {
		center: activeCityLocation,
		zoom: 12,
		mapTypeControl: false
	});
	/*var marker = new google.maps.Marker({
		map: map,
        position: activeCityLocation,
        title: 'Title of marker'
    });//*/



	var request = {
		location: activeCityLocation,
		radius: '5000'
	}

	service = new google.maps.places.PlacesService(map);
	//service.nearbySearch(request, callback);

}

function callback(results, status) {
	console.log(results);
}


sunnyExpressApp.controller('MapCtrl', function ($scope, SunnyExpress) {

	$scope.refreshMap = function() {
		SunnyExpress.setMapCenter(map);
	}

});
