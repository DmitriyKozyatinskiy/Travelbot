;(function () {
  'use strict';

  window._settings = null;
  var _possibleUrls = [];

  function getSettings() {
    var dfd = $.Deferred();

    $.get('../settings.json', function (settings) {
      dfd.resolve(JSON.parse(settings));
    });

    return dfd.promise();
  }

  function captureRequest(request) {
    var matchedUrl = matchRequestUrl(request.url, _possibleUrls);

    if (!matchedUrl) {
      return;
    }

    var data = request.url.split(matchedUrl.suffix)[1];

    if (!data) {
      return;
    }

    data = data.split('?')[0];

    var dates = getDates(data, matchedUrl);
    dates.forEach(function(date) {
      data = data.replace(date);
    });

    var IATACodes = getIATA(data, matchedUrl);

    if (!IATACodes.length || !dates.length) {
      return;
    }

    var flightData = {
      dates: dates,
      codes: IATACodes,
      saveDate: new Date(),
      type: 'flight'
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

  function saveFlight(flightData) {
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

      if (flightData.type == 'hotel') {
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

  function getIATA(data, matchedUrl) {
    data = data.split(matchedUrl.firstLevelSplitter);
    data = _.without(data, '', undefined, "undefined");
    data = data.join(matchedUrl.secondLevelSplitter);
    data = data.split(matchedUrl.secondLevelSplitter);
    data = _.without(data, '', undefined, "undefined");
    data = _.uniq(data);
    _.remove(data, function(item) {
      return item.length !== 3;
    });

    return data;
  }

  function getDates(dataString, matchedUrl) {
    var dates = [];
    var data = dataString.split(matchedUrl.firstLevelSplitter);
    data.forEach(function (dataPart) {
      var date = moment(dataPart, matchedUrl.datePattern).format('YYYY-MM-DD');
      if (date !== 'Invalid date') {
        dates.push(date);
      }
    });

    if (!dates.length) {
      data = dataString.split(matchedUrl.secondLevelSplitter);
      data.forEach(function (dataPart) {
        var date = moment(dataPart, matchedUrl.datePattern).format('YYYY-MM-DD');
        if (date !== 'Invalid date') {
          dates.push(date);
        }
      });
    }

    dates = _.uniq(dates);
    _.remove(dates, function(date) {
      var yesterdayDate = new Date(moment(new Date()).subtract(1, 'days').format('YYYY-MM-DD'));
      return new Date(date) <= yesterdayDate;
    });

    return dates.sort(function (dateA, dateB) {
      return new Date(dateA) - new Date(dateB);
    });
  }

  function matchRequestUrl(url, possibleUrls) {
    var i;
    for(i = 0; i < possibleUrls.length; i++) {
      if (url.search(possibleUrls[i].url) != -1) {
        return possibleUrls[i];
      }
    }
    return false;
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

    chrome.webRequest.onBeforeRequest.addListener(captureRequest, {
      urls: ['<all_urls>'],
      types: ['main_frame']
    }, ['blocking', 'requestBody']);

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
        var siteName = matchRequestUrl(request.getCurrentSiteName, _possibleUrls);
        sendResponse(siteName.url || 'Search');
      } else if (request.requestLastSearch) {
        getData().done(function (flights) {
          var lastFlightSearch = _.maxBy(_.filter(flights, function(flight) {
            return flight.type === 'flight'
          }), function(flight) {
            return flight.searchDate;
          });

          var lastHotelSearch = _.maxBy(_.filter(flights, function(flight) {
            return flight.type === 'hotel'
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
    console.log(request);
    if (request.getTemplate) {
      $.get('../html/toolbar.html', function(response) {
        sendResponse(response);
      });
    } else if (request.url) {
      console.log('URL: ', searchUrl);

      if (request.data.type === 'hotels') {
        Search.searchHotels(false, request.data);
        request.data.type = 'hotel';
        saveFlight(request.data);
      } else {
        var searchUrl = UrlGenerator.generateFlightUrl(request.data, request.url);
        sendResponse(searchUrl);
      }
    } else if (request.saveHotelSearch) {
      saveFlight(request.saveHotelSearch).done(function() {
        sendResponse(true);
      });
    }
    return true;
  });
}());