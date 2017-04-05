sunnyExpressApp.controller('CalendarCtrl', function($scope, $filter, $mdDialog, SunnyExpress, MaterialCalendarData) {
	$scope.dayFormat = "d";
	$scope.selectedDate = new Date();
	$scope.tooltips = true;
	$scope.firstDayOfWeek = 0; // First day of the week, 0 for Sunday, 1 for Monday, etc.

	$scope.forecastDisplay = SunnyExpress.getForecastDisplay();

	$scope.setDirection = function(direction) {
	  $scope.direction = direction;
	  $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
	};

	$scope.dayClick = function(date) {
	  $scope.msg = "You clicked " + $filter("date")(date, "MMM d, y h:mm:ss a Z");
	};

	$scope.fillCalendar = function(date) {
		var trip = SunnyExpress.getTripForDay(date);
		setCalendarContent(date, trip);	
	}

	$scope.mapConditionIdName = {
		1000: "sunny",
		1006: "cloudy",
		1189: "rain",
		1219: "snow"
	};

	$scope.colorPanel = {
		white: "white",
		blue: "#99ccff",
		green: "#66ff66",
		purple: "#df80ff",
		red: "#ff6666"
	};

	$scope.colorEvent = SunnyExpress.getColorEvent();

		// //temporal trip for testing - to be removed afterwards
		// var departDate = new Date();
		// var returnDate = new Date();
		// returnDate.setDate(departDate.getDate() + 2);
		// var departCity = 'Stockholm';
		// var returnCity = 'Madrid';
		// var trip = {"start": departDate, "end": returnDate, "departCity": departCity, "arriveCity": returnCity};
		// SunnyExpress.addNewTrip(trip);
		// //end temporal trip

	var setCalendarContent = function(date, trip) {
		if (trip != null) {
			var departureText;
			switch (trip.state) {
				case 0:
					departureText = "<div layout:\"row\"><p class=\"" + SunnyExpress.getColorEvent() + "-event\">Going to: <br><b>" + trip.data.arriveCity + "</b></p></div>"
					break;
				case 1:
					departureText = "<div layout:\"row\"><p class=\"" + SunnyExpress.getColorEvent() + "-event\">Coming back to: <br><b>" + trip.data.departCity + "</b></p></div>";
					break;
				case 2:
					departureText = "<div layout:\"row\"><p class=\"" + SunnyExpress.getColorEvent() + "-event\">On a trip</p></div>";
					break;
			}
			if (SunnyExpress.getForecastDisplay() == true) {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\" layout:\"column\">\
					<div class=\"delete-btn\" layout:\"row\"><img src=\"../images/delete.png\"></div>"
					+ departureText + 
					"<div layout:\"row\">\
					<img src=\"../images/icons-map/sunny.png\"style=\"min-width: 20px; min-height: 20px;\">\
					</div></div>");
			} else {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\" layout:\"column\">\
					<div class=\"delete-btn\" layout:\"row\"><img src=\"../images/delete.png\"></div>"
					+ departureText + "</div>");
			}
		} else if (trip == null) {
			MaterialCalendarData.setDayContent(date, "<div></div>");
		}
	};

	var getDatesTrip = function(trip) {
		var dates = [];
		dates.push(trip.start);

		date = new Date();
		date.setDate(trip.start.getDate());


		while (date.getTime() <= trip.end.getTime()) {
			var tmp = new Date();
			tmp.setDate(date.getDate() + 1);
			dates.push(tmp);
			date = tmp;
		}
		return dates;
	};

	var getDateState = function(date, trip) {
		if (date.toDateString() === trip.start.toDateString())
			return {
				"data": trip,
				"state": 0
			};
		else if (date.toDateString() === trip.end.toDateString())
			return {
				"data": trip,
				"state": 1
			};
		else
			return {
				"data": trip,
				"state": 2
			};		
	};


    // Appending dialog to document.body to cover sidenav in docs app
    

    


	$scope.deleteTrip = function(date) {
      var trips = SunnyExpress.getTrips();
      var deletedTrip = {};
  		for (id in trips) {
  			var tripDates = getDatesTrip(trips[id]);
  			for (var j = 0; j < tripDates.length; j++) {
  				if (date.getDate() == tripDates[j].getDate()
  				&& date.getMonth() == tripDates[j].getMonth()
  				&& date.getFullYear() == tripDates[j].getFullYear()) {
  					var confirmDeletion = $mdDialog.confirm()
			          .title('Do you really want us to delete your trip?')
			          .textContent('Your trip to '+ trips[id].arriveCity + ' would be entirely deleted from your trips history.')
			          .ariaLabel('Trip deletion')
			          .ok('Please do it!')
			          .cancel('No, thanks');

  					$mdDialog.show(confirmDeletion).then(function() {
      					deletedTrip = trips[id];
      					SunnyExpress.removeTrip(id);

      					if(SunnyExpress.getIsLoggedIn()) {
							SunnyExpress.backendRemoveTrip.delete({"id":id}, function(data){
								if(data.resp != "OK") {
									$mdDialog.show(
										$mdDialog.alert()
											.parent(angular.element(document.querySelector('#general-view')))
											.clickOutsideToClose(true)
											.title('ERROR WHILE DELETING TRIP IN DB')
											.textContent('The trip deleting in the DB was unsuccessful due to an error.')
											.ariaLabel('Alert')
											.ok('Got it!')
									);
								}
							});
						}

      					var d = new Date();
				  		d.setTime(deletedTrip.start.getTime());

				  		while (d.getTime() <= deletedTrip.end.getTime()) {
				  			var tmp = new Date();
				  			tmp.setDate(d.getDate() +1);
				  			setCalendarContent(d, null);
				  			d.setDate(tmp.getDate());	
				  		}
    				}, function() {
    				});
  				}
  			}
  		}
    };

	$scope.onChange = function(state) {
  		SunnyExpress.setForecastDisplay(!state);
  		var trips = SunnyExpress.getTrips();
  		for (id in trips) {
  			var tripDates = getDatesTrip(trips[id]);
  			for (var j = 0; j < tripDates.length; j++) {
  				var dateState = getDateState(tripDates[j], trips[id]);
  				setCalendarContent(tripDates[j], dateState);
  			}
  			
  		}
  	};

    $scope.changeColor = function(color) {
		SunnyExpress.setColorEvent(color);
      	var trips = SunnyExpress.getTrips();
  		for (id in trips) {
  			var tripDates = getDatesTrip(trips[id]);
  			for (var j = 0; j < tripDates.length; j++) {
  				var dateState = getDateState(tripDates[j], trips[id]);
  				setCalendarContent(tripDates[j], dateState);
  			}
  			
  		}
    };

});
