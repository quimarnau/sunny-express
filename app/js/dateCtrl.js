/**
 * TODO: Main concern here is that our weather API might only make a 15-day prediction at best
 */
sunnyExpressApp.controller('DateCtrl', function() {

	this.departureDate = new Date();
	this.returnDate = new Date(
		this.departureDate.getFullYear(),
		this.departureDate.getMonth(),
		this.departureDate.getDate() + 1
	);

	this.minDepartureDate = this.departureDate;
	this.minReturnDate = this.returnDate;

	this.maxReturnDate = new Date(
		this.minDepartureDate.getFullYear(),
		this.minDepartureDate.getMonth(),
		this.minDepartureDate.getDate() + 14
	);
	this.maxDepartureDate = new Date(
		this.maxReturnDate.getFullYear(),
		this.maxReturnDate.getMonth(),
		this.maxReturnDate.getDate() - 1
	);

});
