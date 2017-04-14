sunnyExpressApp.controller('MapCtrl', function ($scope, SunnyExpress, $rootScope, $mdDialog) {

	$scope.mapConditionIdName = SunnyExpress.getMapConditionIdName();
	$scope.iconPath = '../images/icons-map/';
	$scope.ext = '.png';
	$scope.mapFeatures = SunnyExpress.getMapFeatures();
	
	$scope.getCityCoords = function() {
		var activeCities = SunnyExpress.getActiveCities();
		if (Object.keys(activeCities).length == 0 && $rootScope.searchPerformed == true) {
			$rootScope.searchPerformed = false;

            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#general-view')))
                    .clickOutsideToClose(true)
                    .title('NO CITIES FOUND')
                    .textContent('With the current parameters, there are no cities found for your vacation!')
                    .ariaLabel('Alert')
                    .ok('Got it!')
            );

        }
		$scope.cityInfo = activeCities;

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
	}
	};

	$scope.infoWindow = {
	};

	$scope.onCloseInfoWindow = function() {
		$scope.infoWindow.showInfo = false;
		SunnyExpress.setSelectedCity(undefined);
	};

	function callback(results, status) {
		console.log(results);
	}

	$scope.closeInfoWin = function () {
		$scope.infoWindow.showInfo = false;
	};


});
