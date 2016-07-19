;(function () {
  'use strict';

  window._settings = null;
  
  function requestData() {
    var dfd = $.Deferred();

    chrome.runtime.sendMessage({requestFlights: true}, function(response) {
      dfd.resolve(response);
    });

    return dfd.promise();
  }

  Loader.show();
  Search.setForm().done(function() {
    requestData().done(function(data) {
      window._settings = data.settings;
      UrlGenerator.getCurrentPageUrl().done(function(currentUrl) {
        FlightList.show(data.flights, currentUrl).always(function() {
          Loader.hide();
        });
      }).fail(function() {
        Loader.hide();
      });
    });
  }).fail(function() {
    Loader.hide();
  });
}());