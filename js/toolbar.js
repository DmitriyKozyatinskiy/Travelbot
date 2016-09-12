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
    console.log('HELLOkogLDSKJLKS', options);
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
          $fromDate.val(moment(options.lastSearch[0].dates[0], 'YYYY-MM-DD').format('DD-MM-YYYY'));
        }
        if (options.lastSearch[0].dates[1]) {
          $toDate.val(moment(options.lastSearch[0].dates[1], 'YYYY-MM-DD').format('DD-MM-YYYY'));
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
          $fromDate.val(moment(options.lastSearch[1].dates[0], 'YYYY-MM-DD').format('DD-MM-YYYY'));
        }
        if (options.lastSearch[1].dates[1]) {
          $toDate.val(moment(options.lastSearch[1].dates[1], 'YYYY-MM-DD').format('DD-MM-YYYY'));
        }
      }
    }, 1000);
  }

  function setAirportCodesAutocomplition() {
    $('.fl-airport-picker').autocomplete({
      source: function(request, response) {
        $.ajax({
          url: 'https://www.air-port-codes.com/search',
          jsonp: 'callback',
          dataType: 'json',
          data: {
            term: request.term,
            limit: 7,
            size: 1,
            key: 'f262d5eb6e',
            secret: '86ba46b8f9b37c6'
          }
        }).done(function(data) {
          console.log(data);
          if (data.status) {
            response( $.map( data.airports, function( item ) {
              return {
                label: item.name + ' (' + item.iata + ')',
                value: item.iata,
                code: item.iata
              }
            }));
          } else {
            response();
          }
        });
      },
      select: function(event, ui) {
        var $input = $(this);
        $input.attr('data-value', ui.item.code);
        $input.val(ui.item.value);
      }
    });
  }
  
  function search() {
    var dfd = $.Deferred();
    var currentType = $('#fl-type-select').val();
    var dates;
    var data;

    if (currentType === 'hotel') {
      console.log('HOTEL!!!');
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
    } else {
      console.log('FLIGHT!');
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

    chrome.runtime.sendMessage({ url: location.href, data: data }, function(response) {
      if (response) {
        location.href = response;
      }
    });

    return dfd.promise();
  }

  function getHotelSearchData() {
    var location = $(_currentSettings.hotels.locationInput).val();
    var startDate = $(_currentSettings.hotels.startDateInput).val();
    var endDate = $(_currentSettings.hotels.endDateInput).val();
    console.log('Start: ', startDate);
    console.log('End: ', endDate);
    console.log('Pattern: ', _currentSettings.hotels.datePattern);

    startDate = moment(startDate, _currentSettings.hotels.datePattern).format('YYYY-MM-DD');
    endDate = moment(endDate, _currentSettings.hotels.datePattern).format('YYYY-MM-DD');

    console.log('Start: ', startDate);
    console.log('End: ', endDate);

    return {
      location: location,
      dates: [startDate, endDate],
      saveDate: new Date(),
      type: 'hotel',
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
          $(document).on('click', _currentSettings.hotels.submitButton, function() {
            var hotelData = getHotelSearchData();

            chrome.runtime.sendMessage({ saveHotelSearch: hotelData }, function(response) {});
          });

          if (!options.lastSearch[0] && !options.lastSearch[1]) {
            return;
          }
          setToolbar(template, options);
          setAirportCodesAutocomplition();

          $('#fl-submit-button').html(response);
        });
      });

      $(document).on('submit', '#fl-toolbar-form', function(event) {
        event.preventDefault();
        search();
      }).on('change', '.fl-airport-picker', function() {
        var $input = $(this);
        var currentValue = $input.val();
        $input.attr('data-value', currentValue);
      }).on('change', '#fl-type-select', function() {
        var currentType = $(this).val();

        if (currentType === 'hotel') {
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