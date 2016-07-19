var UrlGenerator = (function() {
  'use strict';

  function getCurrentPageUrl() {
    var dfd = $.Deferred();
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {urlRequired: true}, function(url) {
        if (url) {
          dfd.resolve(url);
        } else {
          dfd.reject();
        }
      });
    });
    return dfd.promise();
  }

  function getSettingsForCurrentWebSite(currentUrl) {
    var currentSettings = null;

    _.forEach(window._settings.urls, function(settingsItem) {
      if (currentUrl.search(settingsItem.url) !== -1) {
        currentSettings = settingsItem;
        return false;
      }
    });
    return currentSettings;
  }

  function generateFlightUrl(flight, currentUrl) {
    var settings = getSettingsForCurrentWebSite(currentUrl);
    var url = 'https://' + settings.prefix + settings.url + settings.suffix + settings.pattern;
    var dates = flight.dates.map(function (date) {
      if (!date) {
        return '';
      }
      return moment(date).format(settings.datePattern);
    });
    url = url.replace(/%from%/gi, flight.codes[0] || '');
    url = url.replace(/%to%/gi, flight.codes[1] || '');
    url = url.replace(/%fromDate%/gi, dates[0] || '');
    url = url.replace(/%toDate%/gi, dates[1] || '');

    return url;
  }

  function generateFlightText(flight) {
    var dates = flight.dates.map(function (date) {
      return moment(date).format('DD/MM');
    });

    var codeString = flight.codes[0] + ' > ' + flight.codes[1];
    var dateString = dates[0] + (dates[1] ? ' - ' + dates[1] : '');

    return {
      codeString: codeString,
      dateString: dateString
    }
  }

  return {
    generateFlightUrl: generateFlightUrl,
    generateFlightText: generateFlightText,
    getCurrentPageUrl: getCurrentPageUrl
  }
}());