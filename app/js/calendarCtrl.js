sunnyExpressApp.controller('CalendarCtrl', function($scope, $filter, SunnyExpress, MaterialCalendarData) {
	$scope.dayFormat = "d";
	$scope.selectedDate = new Date();
	$scope.tooltips = true;
	$scope.firstDayOfWeek = 0; // First day of the week, 0 for Sunday, 1 for Monday, etc.
	
	$scope.setDirection = function(direction) {
	  $scope.direction = direction;
	  $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
	};

	$scope.dayClick = function(date) {
	  $scope.msg = "You clicked " + $filter("date")(date, "MMM d, y h:mm:ss a Z");
	};

	$scope.fillCalendar = function(date) {
		var trip = SunnyExpress.getTripForDay(date);
		if (trip != null) {
			var departureText;
			switch (trip.state) {
				case 0:
					departureText = "Going to: <br><b>" + trip.data.arriveCity + "</b>"
					break;
				case 1:
					departureText = "Coming back to: <br><b>" + trip.data.departCity + "</b>";
					break;
				case 2:
					departureText = "On a trip";
					break;
			}
			MaterialCalendarData.setDayContent(date, "<p>" + departureText + "</p>");
		}
	};

});
