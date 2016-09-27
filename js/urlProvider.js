;(function() {
  'use strict';

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.urlRequired) {
      var url = location.href;
      sendResponse(url);
    } else if (request.searchUrl) {
      sendResponse(true);
      location.href = request.searchUrl;
    } else if (request.settings) {
      // setHotelsForm(request.hotelsObject, request.data);
    }
  });
}());