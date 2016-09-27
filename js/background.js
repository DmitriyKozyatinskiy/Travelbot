;(function () {
  'use strict';

  window._settings = null;
  var _possibleUrls = [];
  
  function search(data, type) {
    console.log('DATA: ', data);
    console.log('TYPE: ', type);

    var dfd = $.Deferred();

    UrlGenerator.getCurrentPageUrl().done(function(currentUrl) {
      saveFlight(data, currentUrl);

      var settings = null;
      if (type == 'flights') {
        settings = UrlGenerator.getSettingsForCurrentWebSite(currentUrl);
      } else if (type == 'hotels') {
        settings = UrlGenerator.getSettingsForCurrentWebSite(currentUrl).hotels;
      }
      var searchUrl = settings.searchUrl;

      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { searchUrl: 'https://' + searchUrl, data: data }, function() {
          var loadInterval = window.setInterval(function() {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, { urlRequired: true }, function(url) {
                if (url.search(searchUrl) !== -1) {
                  window.clearInterval(loadInterval);
                  window.setTimeout(function() {
                    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                      chrome.tabs.sendMessage(tabs[0].id, { fillForm: { settings: settings, data: data } }, function() {
                        dfd.resolve();
                      });
                    });
                  }, 1000);
                }
              });
            });
          }, 1000);
        });
      });
    });

    return dfd.promise();
  }
  
  function getSettings() {
    var dfd = $.Deferred();

    $.get('../settings.json', function (settings) {
      dfd.resolve(JSON.parse(settings));
    });

    return dfd.promise();
  }

  function captureRequest(request) {
    var flightData = {
      dates: dates,
      codes: IATACodes,
      saveDate: new Date(),
      type: 'flights'
    };
    saveFlight(flightData);
  }

  function getData() {
    var dfd = $.Deferred();

    chrome.storage.sync.get('flights', function(flights) {
      flights = flights.flights || [];
      dfd.resolve(flights);
    });

    return dfd.promise();
  }

  function saveFlight(flightData, currentUrl) {
    var dfd = $.Deferred();
    var sameFlightIndex = -1;

    getData().done(function (flights) {
      var maxId;

      try {
        maxId = _.max(flights, function(flight) {
          return flight.id;
        }).id || 1;
      } catch (e) {
        maxId = 1;
      }

      if (flightData.type === 'hotels') {
        sameFlightIndex = checkIfHotelAlreadyExists(flightData, flights);
      } else {
        sameFlightIndex = checkIfAlreadyExists(flightData, flights);
      }

      if (sameFlightIndex !== -1) {
        flightData.id = flightData.id || maxId + 1;
        flights[sameFlightIndex] = flightData;
      } else {
        flightData.id = maxId + 1;
        flights.push(flightData);
        chrome.runtime.sendMessage({ addSearchRow: { search: flightData, currentUrl: currentUrl } }, function(response) {});
      }

      flightData.searchDate = new Date().getTime();

      chrome.storage.sync.set({flights: flights}, function() {
        dfd.resolve(flights);
      });
    });

    return dfd.promise();
  }

  function removeFlight(id) {
    var dfd = $.Deferred();

    getData().done(function(flights) {
      _.remove(flights, function(flight) {
        return flight.id == id;
      });
      chrome.storage.sync.set({flights: flights}, function() {
        dfd.resolve(flights);
      });
    });

    return dfd.promise();
  }

  function checkIfAlreadyExists(newFlight, flights) {
    var existingIndex = -1;

    _.forEach(flights, function(flightToCompare, i) {
      try {
        var isSame = (flightToCompare.dates[0] == newFlight.dates[0]
        && flightToCompare.dates[1] == newFlight.dates[1]
        && flightToCompare.codes[0] == newFlight.codes[0]
        && flightToCompare.codes[1] == newFlight.codes[1]);
        if (isSame) {
          existingIndex = i;
        }
      } catch(e) {}
    });

    return existingIndex;
  }

  function checkIfHotelAlreadyExists(newHotel, hotels) {
    var existingIndex = -1;

    _.forEach(hotels, function(hotelToCompare, i) {
      try {
        var isSame = (hotelToCompare.dates[0] == newHotel.dates[0]
        && hotelToCompare.dates[1] == newHotel.dates[1]
        && hotelToCompare.location == hotelToCompare.location);
        if (isSame) {
          existingIndex = i;
        }
      } catch(e) {}
    });

    return existingIndex;
  }
  
  function convertDates(dates, settings) {
    return dates.map(function(date) {
      return moment(date, settings.datePattern).format('DD-MM-YYYY');
    });
  }

  function matchRequestUrl(url, possibleUrls) {
    var i;
    for(i = 0; i < possibleUrls.length; i++) {
      if (url.search(possibleUrls[i].url) != -1) {
        return possibleUrls[i];
      }
    }
    return {};
  }

  function getPossibleUrlsArray(settings) {
    var possibleUrls = [];

    settings.urls.forEach(function (url) {
      possibleUrls.push(url.url)
    });

    return possibleUrls;
  }

  getSettings().done(function (settings) {
    window._settings = settings;
    _possibleUrls = settings.urls;
    
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.requestFlights) {
        getData().done(function (flights) {
          sendResponse({
            flights: flights,
            settings: window._settings
          });
        });
      } else if (request.removeFlightById) {
        removeFlight(request.removeFlightById).done(function() {
          sendResponse(request.removeFlightById);
        });
      } else if (request.getCurrentSiteName) {
        var siteName = matchRequestUrl(request.getCurrentSiteName, _possibleUrls).url || false;
        sendResponse(siteName);
      } else if (request.requestLastSearch) {
        getData().done(function (flights) {
          console.log('FLIGHTS: ', flights);
          var lastFlightSearch = _.maxBy(_.filter(flights, function(flight) {
            return flight.type === 'flights'
          }), function(flight) {
            return flight.searchDate;
          });

          var lastHotelSearch = _.maxBy(_.filter(flights, function(flight) {
            return flight.type === 'hotels'
          }), function(flight) {
            return flight.searchDate;
          });

          var lastSearch = [lastFlightSearch, lastHotelSearch];
          settings = UrlGenerator.getSettingsForCurrentWebSite(request.requestLastSearch);
          sendResponse({lastSearch: lastSearch, settings: settings});
        });
      } else if (request.requestSettings) {
        return window._settings;
      }
      return true;
    });
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.getTemplate) {
      $.get('../html/toolbar.html', function(response) {
        sendResponse(response);
      });
    } else if (request.saveSearch) {
      saveFlight(request.saveSearch);
    } else if (request.search) {
      search(request.search.data, request.search.type);
    }
    // else if (request.url) {
    //   if (request.data.type === 'hotels') {
    //     Search.searchHotels(false, request.data);
    //     request.data.type = 'hotel';
    //     saveFlight(request.data);
    //   } else {
    //     var searchUrl = UrlGenerator.generateFlightUrl(request.data, request.url);
    //     sendResponse(searchUrl);
    //   }
    // } else if (request.saveHotelSearch) {
    //   saveFlight(request.saveHotelSearch).done(function() {
    //     sendResponse(true);
    //   });
    // }
    return true;
  });
}());