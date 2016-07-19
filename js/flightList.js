var FlightList = (function() {
  'use strict';

  var $flightListContainer = $('#js-flight-list-container');

  function generateTemplateData(flights, currentUrl) {
    var templateData = [];

    flights.forEach(function(flight) {
      var text = UrlGenerator.generateFlightText(flight, currentUrl);
      templateData.push({
        id: flight.id,
        url: UrlGenerator.generateFlightUrl(flight, currentUrl),
        codeString: text.codeString,
        dateString: text.dateString
      });
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
      $button.closest('.js-flight-container').remove();
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