sunnyExpressApp.controller('CalendarCtrl', function($scope, $filter, SunnyExpress, MaterialCalendarData) {
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

	$scope.mapConditionIdName = {
		1000: "sunny",
		1006: "cloudy",
		1189: "rain",
		1219: "snow"
	};

	var fillCalendar = function(date) {
		var trip = SunnyExpress.getTripForDay(date);
		if (trip != null) {
			var departureText;
			switch (trip.state) {
				case 0:
					departureText = "<p class=\"blue-event\">Going to: <br><b>" + trip.data.arriveCity + "</b></p>"
					break;
				case 1:
					departureText = "<p class=\"blue-event\">Coming back to: <br><b>" + trip.data.departCity + "</b></p>";
					break;
				case 2:
					departureText = "<p class=\"blue-event\">On a trip</p>";
					break;
			}
			if (SunnyExpress.getForecastDisplay() == true) {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\" layout:\"column\">" + departureText + "<img src=\"../images/icons-map/sunny.png\"style=\"min-width: 20px; min-width: 20px;\"></div>");
			} else {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\" layout:\"column\">" + departureText + "</div>");
			}
		}
	};

	$scope.fillCalendar = fillCalendar;

	var getDatesTrip = function(trip) {
		var dates = [];
		dates.push(trip.start);

		date = new Date();
		date.setDate(trip.start.getDate());


		while (date.getTime() <= trip.end.getTime()) {
			tmp = new Date();
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
	

	$scope.onChange = function(state) {
  		SunnyExpress.setForecastDisplay(!state);
  		var trips = SunnyExpress.getTrips();
  		for (var i = 0; i < trips.length; i++) {
  			var tripDates = getDatesTrip(trips[i]);
  			for (j = 0; j < tripDates.length; j++) {
  				var dateState = getDateState(tripDates[j], trips[i]);
  				var departureText;
				switch (dateState.state) {
					case 0:
						departureText = "<p class=\"blue-event\">Going to: <br><b>" + dateState.data.arriveCity + "</b></p>"
						break;
					case 1:
						departureText = "<p class=\"blue-event\">Coming back to: <br><b>" + dateState.data.departCity + "</b></p>";
						break;
					case 2:
						departureText = "<p class=\"blue-event\">On a trip</p>";
						break;
				}
				if (SunnyExpress.getForecastDisplay() == true) {
					MaterialCalendarData.setDayContent(tripDates[j], "<div align=\"center\" layout:\"column\">" + departureText + "<img src=\"../images/icons-map/sunny.png\"style=\"min-width: 20px; min-width: 20px;\"></div>");
				} else {
					MaterialCalendarData.setDayContent(tripDates[j], "<div align=\"center\" layout:\"column\">" + departureText + "</div>");
				}
  			}
  			
  		}
  	};

});
