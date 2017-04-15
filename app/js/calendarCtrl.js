sunnyExpressApp.controller('CalendarCtrl', function($scope, $filter, $mdDialog, mapConditionIdName, trips, SunnyExpress, MaterialCalendarData) {

	if(SunnyExpress.getMapConditionIdName() == undefined) SunnyExpress.setMapConditionIdName(mapConditionIdName);
	if((SunnyExpress.getIsLoggedIn()) && (Object.keys(SunnyExpress.getTrips()).length == 0)) SunnyExpress.setTrips(trips);
	
	//Calendar set up
	$scope.dayFormat = "d";
	$scope.selectedDate = new Date();
	$scope.tooltips = true;
	$scope.firstDayOfWeek = 0; // First day of the week, 0 for Sunday, 1 for Monday, etc.
	var today = new Date();
	var trips = SunnyExpress.getTrips();

	$scope.setDirection = function(direction) {
	  $scope.direction = direction;
	  $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
	};

	$scope.fillCalendar = function(date) {
		var trip = SunnyExpress.getTripForDay(date);
		setCalendarContent(date, trip);	
	}

	//Forecast display
	$scope.forecastDisplay = SunnyExpress.getForecastDisplay();

	var mapConditionIdName = SunnyExpress.getMapConditionIdName();

	$scope.getWeatherIcon = function(code) {
		return SunnyExpress.filterCode(code);
	};
	
	var selectedTrip = undefined;
	var selectedTripId = undefined;

	var tripSelection = function () {
		if (selectedTrip != undefined) {
			return true;
		} else {
			return false;
		}
	}
	
	$scope.tripSelected = tripSelection();

	var isToolBarOpen = false;

	var setCalendarSize = function () {
		if (angular.equals(trips, {})) {
			$scope.calendarSize = "lg-cal";
		} else {
			if (isToolBarOpen) {
				$scope.calendarSize = "sm-cal";
			} else {
				$scope.calendarSize = "md-cal";
			}
		}
	}

	setCalendarSize();

	var closeToolBar = function () {
		selectedTrip = undefined;
		selectedTripId = undefined;
		isToolBarOpen = false;
		$scope.tripSelected = tripSelection();
		setCalendarSize();

	};

	var openToolBar = function() {
		if (selectedTrip != undefined) {
			$scope.tripSelected = true;
			isToolBarOpen = true;
			$scope.tripTxt = "trip to " + selectedTrip.arriveCity;
			setCalendarSize();
		}
	};

	$scope.doneModifying = function() {
		closeToolBar();
	};

	$scope.selectTrip = function(date) {
		
		closeToolBar();
		for (id in trips) {
			var tripDates = getDatesTrip(trips[id]);
			for (var j = 0; j < tripDates.length; j++) {
				if (date.getDate() == tripDates[j].getDate()
				&& date.getMonth() == tripDates[j].getMonth()
				&& date.getFullYear() == tripDates[j].getFullYear()) {
					selectedTrip = trips[id];
					selectedTripId = id;
					openToolBar();
					break;
				}
			}
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

	var setCalendarContent = function(date, trip) {
		if (trip != null) {
			var departureText;
			switch (trip.state) {
				case 0:
					departureText = "<div layout:\"row\"><p class=\"" + trip.data.color + "-event\">Going to: <br><b>" + trip.data.arriveCity + "</b></p></div>"
					break;
				case 1:
					departureText = "<div layout:\"row\"><p class=\"" + trip.data.color + "-event\">Coming back to: <br><b>" + trip.data.departCity + "</b></p></div>";
					break;
				case 2:
					departureText = "<div layout:\"row\"><p class=\"" + trip.data.color + "-event\">On a trip</p></div>";
					break;
			}
			if ((SunnyExpress.getForecastDisplay() == true) && ((date.getTime() > today.getTime()) || (date.toDateString() == today.toDateString()))) {
				var dayConditionName = undefined;
				for(var i = 0; i< trip.data.forecast.length; i++) {
					var tempDate = new Date(trip.data.forecast[i].date);
					if(date.toDateString() === tempDate.toDateString()){
						dayConditionName = mapConditionIdName[trip.data.forecast[i].condition];
					}
				}
				MaterialCalendarData.setDayContent(date, "<div align=\"center\" layout:\"column\">"
					+ departureText + 
					"<div layout:\"row\">\
					<img src=\"../images/icons-map/"+dayConditionName+".png\" id=\"sm-weather-icon\">\
					</div></div>");
			} else {
				MaterialCalendarData.setDayContent(date, "<div align=\"center\" layout:\"column\">"
					+ departureText + "</div>");
			}
		} else if (trip == null) {
			MaterialCalendarData.setDayContent(date, "<div></div>");
		}
	};

	$scope.deleteTrip = function() {
	  
		var deletedTrip = {};

		var confirmDeletion = $mdDialog.confirm()
		  .title('Do you really want us to delete your trip?')
		  .textContent('Your trip to '+ trips[selectedTripId].arriveCity +
			' from ' + trips[selectedTripId].start.toLocaleString("en-us",{month: "long"}) + ' '
			+ trips[selectedTripId].start.getDate() + ' to ' + trips[selectedTripId].end.toLocaleString("en-us",{month: "long"}) + ' '
			+ trips[selectedTripId].end.getDate() + ' would be entirely deleted from your trips history.')
		  .ariaLabel('Trip deletion')
		  .ok('Please do it!')
		  .cancel('No, thanks');

		$mdDialog.show(confirmDeletion).then(function() {
			deletedTrip = trips[selectedTripId];
			SunnyExpress.removeTrip(selectedTripId);

			if(SunnyExpress.getIsLoggedIn()) {
				SunnyExpress.backendRemoveTrip.delete({"id":selectedTripId, "userId": SunnyExpress.getUserId()}, function(data){
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
			closeToolBar();
		}, function() {
		});

	};

	$scope.onChange = function(state) {
		SunnyExpress.setForecastDisplay(!state);
		
		for (id in trips) {
			var tripDates = getDatesTrip(trips[id]);
			for (var j = 0; j < tripDates.length; j++) {
				var dateState = getDateState(tripDates[j], trips[id]);
				setCalendarContent(tripDates[j], dateState);
			}
			
		}
	};

	$scope.colorPanel = {
		white: "white",
		blue: "var(--bg-blue)",
		green: "var(--bg-green)",
		purple: "var(--bg-purple)",
		red: "var(--bg-red)"
	};

	$scope.changeColor = function(color) {
		
		trips[selectedTripId].color = color;
		SunnyExpress.updateTrip(selectedTripId, trips[selectedTripId]);
		var data = {};
		data[selectedTripId] = trips[selectedTripId];

		SunnyExpress.backendUpdateTrip.update({"userId": SunnyExpress.getUserId()},data, function(data){
			if(data.resp != "OK") {
				$mdDialog.show(
					$mdDialog.alert()
						.parent(angular.element(document.querySelector("#general-view")))
						.clickOutsideToClose(true)
						.title("ERROR WHILE UPDATING TRIP IN DB")
						.textContent("The trip updating to the DB was unsuccessful due to an error.")
						.ariaLabel("Alert")
						.ok("Got it!")
				);
			}
		});

		for (id in trips) {
			var tripDates = getDatesTrip(trips[id]);
			for (var j = 0; j < tripDates.length; j++) {
				var dateState = getDateState(tripDates[j], trips[id]);
				setCalendarContent(tripDates[j], dateState);
			}
			
		}
	};

});
