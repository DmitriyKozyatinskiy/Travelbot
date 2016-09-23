var FormDataProvider = (function() {
  'use strict';

  function getHotelSearchData(settings) {
    var location = $(settings.hotels.locationInput).val();
    var startDate = $(settings.hotels.startDateInput).val();
    var endDate = $(settings.hotels.endDateInput).val();

    startDate = moment(startDate, settings.hotels.datePattern).format('DD-MM-YYYY');
    endDate = moment(endDate, settings.hotels.datePattern).format('DD-MM-YYYY');

    return {
      location: location,
      dates: [startDate, endDate],
      saveDate: new Date().getTime(),
      type: 'hotels',
      isHotel: true
    }
  }

  function getFlightSearchData(settings) {
    var fromLocation = $(settings.fromInput).val();
    var toLocation = $(settings.toInput).val();
    var startDate = $(settings.startDateInput).val();
    var endDate = $(settings.endDateInput).val();

    startDate = moment(startDate, settings.datePattern).format('DD-MM-YYYY');
    endDate = moment(endDate, settings.datePattern).format('DD-MM-YYYY');

    return {
      codes: [fromLocation, toLocation],
      dates: [startDate, endDate],
      saveDate: new Date().getTime(),
      type: 'flights'
    }
  }

  return {
    getHotelSearchData: getHotelSearchData,
    getFlightSearchData: getFlightSearchData
  }
}());