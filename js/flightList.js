var FlightList = (function() {
  'use strict';

  var $flightListContainer = $('#js-flight-list-container');

  function generateTemplateData(flights, currentUrl) {
    var templateData = [];

    flights.forEach(function(flight) {
      var url = UrlGenerator.generateFlightUrl(flight, currentUrl);
      var text = UrlGenerator.generateFlightText(flight, currentUrl);
      var flightData;

      if (flight.type === 'hotel') {
        flightData = {
          id: flight.id,
          codeString: text.codeString,
          dateString: text.dateString,
          location: flight.location,
          startDate: flight.dates[0],
          endDate: flight.dates[1],
          isHotel: flight.isHotel
        }
      } else {
        flightData = {
          id: flight.id,
          url: url,
          codeString: text.codeString,
          dateString: text.dateString,
          isHotel: flight.isHotel
        }
      }

      templateData.push(flightData);
    });

    return templateData;
  }
  
  function show(flights, currentUrl){
    var dfd = $.Deferred();
    
    var templateData = generateTemplateData(flights, currentUrl);
    $.get('../html/flightsList.html', function(html) {
      var renderedTemplate = Mustache.render(html, { flights: templateData });
      $flightListContainer.html(renderedTemplate);
      dfd.resolve();
    });

    return dfd.promise();
  }

  $(document).on('click', '.js-remove-flight-button', function () {
    var $button = $(this);
    var id = $button.attr('data-id');
    chrome.runtime.sendMessage({removeFlightById: id}, function(response) {
      var $dataRow = $button.closest('.js-flight-container');
      $dataRow.next('hr').remove();
      $dataRow.remove();
    });
  }).on('click', '.js-flight-list-url', function(event){
    var $flightListButton = $(this);
    var url = $flightListButton.attr('href');

    event.preventDefault();
    Loader.show();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {searchUrl: url}, function() {
        Loader.hide();
      });
    });
  });

  return {
    show: show
  }
}());