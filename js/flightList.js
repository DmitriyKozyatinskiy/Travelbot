var FlightList = (function() {
  'use strict';

  var $flightListContainer = $('#js-flight-list-container');
  var $flightList = $('#js-flight-list');
  var _flightTemplate;
  var _hotelTemplate;

  function generateFlightList(flights, currentUrl) {
    flights.sort(function (flightA, flightB) {
      return flightA.searchDate - flightB.searchDate;
    });
    flights.forEach(function(flight) {
      addSearchRow(flight, currentUrl);
    });
  }
  
  function addSearchRow(flight, currentUrl) {
    // var url = UrlGenerator.generateFlightUrl(flight, currentUrl);
    var text = UrlGenerator.generateFlightText(flight, currentUrl);
    var searchData;
    var renderedTemplate;

    console.log('FLIGHT: ', flight);
    if (flight.type === 'hotels') {
      searchData = {
        id: flight.id,
        codeString: text.codeString,
        dateString: text.dateString,
        location: flight.location,
        startDate: flight.dates[0],
        endDate: flight.dates[1],
        isHotel: true
      };
      renderedTemplate = Mustache.render(_hotelTemplate, searchData);
    } else if (flight.type === 'flights') {
      searchData = {
        id: flight.id,
        // url: url,
        codeString: text.codeString,
        dateString: text.dateString,
        isHotel: flight.isHotel
      };
      renderedTemplate = Mustache.render(_flightTemplate, searchData);
    }

    var $searchRow = $(renderedTemplate);
    $searchRow.find('.js-search-icon').on('click', function(event) {
      event.preventDefault();
      chrome.runtime.sendMessage({ search:  { data: flight, type: flight.type } }, function(response) {});
    });

    $flightList.prepend($searchRow);
  }
  
  function show(flights, currentUrl){
    var dfd = $.Deferred();
    $.get('../html/flightTemplate.html', function(flightTemplate) {
      $.get('../html/hotelTemplate.html', function(hotelTemplate) {
        _flightTemplate = flightTemplate;
        _hotelTemplate = hotelTemplate;
        generateFlightList(flights, currentUrl);
        dfd.resolve();
      })
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

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.addSearchRow) {
      console.log('ADD!!!, ', request.addSearchRow);
      addSearchRow(request.addSearchRow.search, request.addSearchRow.currentUrl);
    }
  });

  return {
    show: show
  }
}());
