;(function() {
  'use strict';

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.urlRequired) {
      var url = location.href;
      sendResponse(url);
    } else if (request.searchUrl) {
      location.href = request.searchUrl;
      sendResponse(true);
    }
  });
}());