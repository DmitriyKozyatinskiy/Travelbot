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

  function setToolbarSwitcher() {
    var dfd = $.Deferred();

    $.get('html/toolbarSwitcher.html', function(template) {
      chrome.storage.local.get('isToolbarDisabled', function(result) {
        var renderedTemplate = Mustache.render(template, { isToolbarDisabled: result.isToolbarDisabled });
        $('#js-switch-container').html(renderedTemplate);
        dfd.resolve();
      });
    });

    return dfd.promise();
  }

  Loader.show();
  setToolbarSwitcher().done(function() {
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
  });

  $(document).on('change', '#js-toolbar-switcher', function() {
    var $switcher = $(this);
    var isDisabled = !$switcher.is(':checked');
    chrome.storage.local.set({ isToolbarDisabled: isDisabled });
  });
}());
