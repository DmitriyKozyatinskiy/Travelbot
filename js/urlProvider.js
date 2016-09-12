;(function() {
  'use strict';

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.urlRequired) {
      var url = location.href;
      sendResponse(url);
    } else if (request.searchUrl) {
      location.href = request.searchUrl;
      sendResponse(true);
    } else if (request.hotelsUrl) {
      sendResponse(true);
      location.href = request.hotelsUrl;
    } else if (request.hotelsObject) {
      setHotelsForm(request.hotelsObject, request.data);
    }
  });

  function setHotelsForm(hotelsObject, data) {
    try {
      document.querySelector('[data-tab="hotel"]').click();
    } catch (e) {}

    console.log('wtf???: ', data);
    
    document.querySelector(hotelsObject.locationInput).value = data.location;
    document.querySelector(hotelsObject.startDateInput).value = data.dates[0];
    document.querySelector(hotelsObject.startDateText).value = data.dates[0];

    if (data.dates[1]) {
      document.querySelector(hotelsObject.endDateInput).value = data.dates[1];
      document.querySelector(hotelsObject.endDateText).value = data.dates[1];
    }
  }
}());