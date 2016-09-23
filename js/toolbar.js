;(function() {
  'use strict';

  var _currentSettings = null;

  function getLastSearch() {
    var dfd = $.Deferred();

    chrome.runtime.sendMessage({requestLastSearch: location.href}, function(response) {
      dfd.resolve(response);
    });
    
    return dfd.promise();
  }
  
  function getToolbarTemplate() {
    var dfd = $.Deferred();

    chrome.runtime.sendMessage({getTemplate: true}, function(response) {
      dfd.resolve(response);
    });

    return dfd.promise();
  }

  function setToolbar(template, options) {
    $('body').prepend($(template));
    $('#fl-submit').val('Search on ' + location.host);
    window.setTimeout(function() {
      $('#pcln-global-header').css('position', 'relative');
      var $fromDate;
      var $toDate;

      if (options.lastSearch[0]) {
        $fromDate = $('#fl-from-date');
        $toDate = $('#fl-to-date');
        $fromDate.datepicker({
          dateFormat: 'dd-mm-yy',
          minDate: new Date()
        });
        $toDate.datepicker({
          dateFormat: 'dd-mm-yy',
          minDate: new Date()
        });
        $('#fl-from').val(options.lastSearch[0].codes[0]);
        $('#fl-to').val(options.lastSearch[0].codes[1]);
        if (options.lastSearch[0].dates[0]) {
          $fromDate.val(options.lastSearch[0].dates[0]);
        }
        if (options.lastSearch[0].dates[1]) {
          $toDate.val(options.lastSearch[0].dates[1]);
        }
      }

      if (options.lastSearch[1]) {
        $fromDate = $('#fl-hotel-from-date');
        $toDate = $('#fl-hotel-to-date');
        $fromDate.datepicker({
          dateFormat: 'dd-mm-yy',
          minDate: new Date()
        });
        $toDate.datepicker({
          dateFormat: 'dd-mm-yy',
          minDate: new Date()
        });
        $('#fl-location').val(options.lastSearch[1].location);
        if (options.lastSearch[1].dates[0]) {
          $fromDate.val(options.lastSearch[1].dates[0]);
        }
        if (options.lastSearch[1].dates[1]) {
          $toDate.val(options.lastSearch[1].dates[0]);
        }
      }
    }, 1000);
  }
  
  function search() {
    var dfd = $.Deferred();
    var currentType = $('#fl-type-select').val();
    var dates;
    var data;

    if (currentType === 'hotels') {
      var searchLocation = $('#fl-location').val();
      dates = [
        $('#fl-hotel-from-date').val(),
        $('#fl-hotel-to-date').val() || ''
      ];
      data = {
        location: searchLocation,
        dates: dates,
        type: 'hotels'
      };
    } else if (currentType === 'flights') {
      var codes = [$('#fl-from').val(), $('#fl-to').val()];
      dates = [
        $('#fl-from-date').val(),
        $('#fl-to-date').val() || ''
      ];
      data = {
        codes: codes,
        dates: dates,
        type: 'flights'
      };
    }

    chrome.runtime.sendMessage({ search:  { data: data, type: currentType } }, function(response) {});

    // chrome.runtime.sendMessage({ url: location.href, data: data }, function(response) {
    //   if (response) {
    //     location.href = response;
    //   }
    // });

    return dfd.promise();
  }

  function getHotelSearchData() {
    var location = $(_currentSettings.hotels.locationInput).val();
    var startDate = $(_currentSettings.hotels.startDateInput).val();
    var endDate = $(_currentSettings.hotels.endDateInput).val();

    startDate = moment(startDate, _currentSettings.hotels.datePattern).format('DD-MM-YYYY');
    endDate = moment(endDate, _currentSettings.hotels.datePattern).format('DD-MM-YYYY');
    
    return {
      location: location,
      dates: [startDate, endDate],
      saveDate: new Date(),
      type: 'hotels',
      isHotel: true
    }
  }

  chrome.storage.local.get('isToolbarDisabled', function(result) {
    if (result.isToolbarDisabled) {
      return;
    }

    chrome.runtime.sendMessage({ getCurrentSiteName: location.href }, function(response) {
      getToolbarTemplate().done(function(template) {
        getLastSearch().done(function(options) {
          _currentSettings = options.settings;
          $(document).on('click', _currentSettings.submitButton, function() {
            var data = FormDataProvider.getFlightSearchData(_currentSettings);
            chrome.runtime.sendMessage({ saveSearch: data }, function(response) {});
          }).on('click', _currentSettings.hotels.submitButton, function() {
            var data = FormDataProvider.getHotelSearchData(_currentSettings);
            chrome.runtime.sendMessage({ saveSearch: data }, function(response) {});
          });

          console.log('OPTIONS: ', options);
          if (!options.lastSearch[0] && !options.lastSearch[1]) {
            return;
          }
          setToolbar(template, options);

          $('#fl-submit-button').html(response);
        });
      });

      $(document).on('submit', '#fl-toolbar-form', function(event) {
        console.log('search');
        event.preventDefault();
        search();
      }).on('change', '.fl-airport-picker', function() {
        var $input = $(this);
        var currentValue = $input.val();
        $input.attr('data-value', currentValue);
      }).on('change', '#fl-type-select', function() {
        var currentType = $(this).val();

        if (currentType === 'hotels') {
          $('#fl-flight-container').addClass('hidden');
          $('#fl-hotel-container').removeClass('hidden');
        } else {
          $('#fl-flight-container').removeClass('hidden');
          $('#fl-hotel-container').addClass('hidden');
        }
      }).on('click', '#fl-submit-button', function() {
        $('input:not(:visible)', '#fl-toolbar-form').prop('required', false);
        $('input:visible[data-required="true"]', '#fl-toolbar-form').prop('required', true);
      });
    });
  });

}());