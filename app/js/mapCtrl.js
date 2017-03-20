sunnyExpressApp.controller('MapCtrl', function ($scope, $window, SunnyExpress) {

    var map;
    var markers = [];

    $scope.onload = function () {
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
        };

        //service = new google.maps.places.PlacesService(map);
        //service.nearbySearch(request, callback);
    }

    function callback(results, status) {
        console.log(results);
    }

	$scope.refreshMap = function() {
		SunnyExpress.setMapCenter(map);

		for (var i = 0; i < markers.length; ++i)
            markers[i].setMap(null);
		markers = [];
		var countryCities = SunnyExpress.getCountryCities();
		if (countryCities != undefined) {
			var infowindow = new google.maps.InfoWindow();
			for (var i = 0; i < countryCities.length; ++i) {
                var activeCity = countryCities[i];
                var activeCityLocation = new google.maps.LatLng(activeCity.lat, activeCity.lon);
                var forecastInfo = activeCity.name == "Paris" ?
					("<br> Date: " + SunnyExpress.responseParis.forecast.forecastday[0].date +
					"<br> Max temp: " + SunnyExpress.responseParis.forecast.forecastday[0].day.maxtemp_c +
					"<br> Min temp: " + SunnyExpress.responseParis.forecast.forecastday[0].day.mintemp_c) : "";
                var marker = new google.maps.Marker({
                    map: map,
                    position: activeCityLocation,
                    title: activeCity.name,
					exp: forecastInfo
                });

                markers.push(marker);

                marker.addListener('mouseover', function() {
                    populateInfoWindow(this, infowindow);
                });
			}
		}
	}

    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('<div>' + marker.title + '\n' + marker.exp + '</div>');
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    }

	$scope.setArriveCity = function() {
        SunnyExpress.setArriveCountry($scope.CountryToVisit);
	}

});
