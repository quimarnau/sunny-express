sunnyExpressApp.controller('CalendarCtrl', function($scope, $filter, SunnyExpress, MaterialCalendarData) {
	$scope.dayFormat = "d";
	$scope.selectedDate = new Date();
	$scope.tooltips = true;
	$scope.firstDayOfWeek = 0; // First day of the week, 0 for Sunday, 1 for Monday, etc.

	//temporal trip for testing - to be removed afterwards
	var departDate = new Date();
	var returnDate = new Date();
	returnDate.setDate(departDate.getDate() + 2);
	var departCity = 'Stockholm';
	var returnCity = 'Madrid';

	var trip = {"start": departDate, "end": returnDate, "departCity": departCity, "arriveCity": returnCity};

	SunnyExpress.addNewTrip(trip);
	//end temporal trip

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
					departureText = "<p>Going to: <br><b>" + trip.data.arriveCity + "</b></p>"
					break;
				case 1:
					departureText = "<p>Coming back to: <br><b>" + trip.data.departCity + "</b></p>";
					break;
				case 2:
					departureText = "<p style=\"color:red\"><br>On a trip<br></p>";
					break;
			}
			if (SunnyExpress.getForecastDisplay() == true) {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\">" + departureText + "<img src=\"../images/icons-map/sunny.png\"style=\"min-width: 30px; min-width: 30px;\"></div>");
			} else {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\">" + departureText + "</div>");
			}
		}
	};

	$scope.fillCalendar = fillCalendar;
	

	$scope.onChange = function(state) {
  		SunnyExpress.setForecastDisplay(!state);
  		//$scope.fillCalendar = fillCalendar;  // -> find way to reload
  		$scope.message = SunnyExpress.getForecastDisplay();
  	};

});
