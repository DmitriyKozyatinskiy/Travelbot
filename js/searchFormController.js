var Search = (function() {
  'use strict';

  var $searchFormContainer = $('#js-search-form-container');

  function search() {
    var dfd = $.Deferred();
    var codes = [$('#js-search-from').val(), $('#js-search-to').val()];
    var dates = [$('#js-search-from-date').val(), $('#js-search-to-date').val() || ''];
    var data = {
      codes: codes,
      dates: dates,
      type: 'flights'
    };

    UrlGenerator.getCurrentPageUrl().done(function(currentUrl) {
      var searchUrl = UrlGenerator.generateFlightUrl(data, currentUrl);
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { searchUrl: searchUrl }, function() {
          dfd.resolve();
        });
      });
    });

    return dfd.promise();
  }

  function searchHotels(isUrlData, data) {
    var dfd = $.Deferred();

    var location;
    var dates;
    var $url;

    if (!data) {
      if (isUrlData) {
        $url = $(this);
        console.log($url);
        location = $url.attr('data-location');
        dates = [$url.attr('data-start-date'), $url.attr('data-end-date')];
      } else {
        location = $('#js-hotel-search').val();
        dates = [$('#js-search-from-date').val(), $('#js-search-to-date').val() || ''];
      }

      data = {
        location: location,
        dates: dates,
        type: 'hotels'
      };
    }

    console.log('DTA: ', data);

    UrlGenerator.getCurrentPageUrl().done(function(currentUrl) {
      var hotelsObject = UrlGenerator.getSettingsForCurrentWebSite(currentUrl).hotels;
      var hotelsUrl = hotelsObject.url;

      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { hotelsUrl: 'https://' + hotelsUrl, data: data }, function() {
          console.log('HotelsUrl: ', hotelsUrl);
          var loadInterval = window.setInterval(function() {
            
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, { urlRequired: true }, function(url) {
                console.log('Url: ', url);
                console.log(hotelsObject);
                if (url.search(hotelsUrl) !== -1) {
                  window.clearInterval(loadInterval);
                  window.setTimeout(function() {

                    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                      chrome.tabs.sendMessage(tabs[0].id, { hotelsObject: hotelsObject, data: data }, function() {
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
  
  function setForm() {
    var dfd = $.Deferred();

    $.get('../html/searchForm.html', function (formTemplate) {
      $searchFormContainer.html(formTemplate);
      setAirportCodesAutocomplition();
      $('#js-search-from-date').datepicker({
        format: 'dd-mm-yyyy',
        orientation: 'top auto',
        startDate: new Date()
      });
      $('#js-search-to-date').datepicker({
        format: 'dd-mm-yyyy',
        orientation: 'top auto',
        startDate: new Date()
      });

      $('.selectpicker').selectpicker();
      $('.js-search-type-select').find('.bs-caret').remove();

      dfd.resolve(formTemplate);
    });

    return dfd.promise();
  }

  function setAirportCodesAutocomplition() {
    $('.js-search-code-input').autocomplete({
      source: function(request, response) {
        var $input = $(this.element);
        var $spinner = $input.parent().find('.js-search-spinner');

        $.ajax({
          url: 'https://www.air-port-codes.com/search',
          jsonp: 'callback',
          dataType: 'jsonp',
          data: {
            term: request.term, // input field value
            limit: 7, // default is 30
            size: 1, // default is 0
            key: 'f262d5eb6e', // dont forget to add your API Key from your air-port-codes.com account
            secret: '86ba46b8f9b37c6'
          },
          beforeSend: function() {
            $spinner.removeClass('hidden').parent().removeClass('hidden');
          }
        }).done(function(data) {
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
        }).always(function() {
          $spinner.addClass('hidden').parent().addClass('hidden');
        });
      },
      select: function(event, ui) {
        var $input = $(this);
        $input.attr('data-value', ui.item.code);
        $input.val(ui.item.value);
      }
    });
  }

  $(document).on('change', '.js-search-type', function(){
    var $radio = $(this);

    if ($radio.val() == 1) {
      $('#js-search-to-date').addClass('hidden').val('');
    } else {
      $('#js-search-to-date').removeClass('hidden');
    }
  }).on('submit', '#js-search-form', function(event) {
    event.preventDefault();
    var currentType = $('.js-search-type-select').selectpicker('val');

    console.log(currentType);
    if (currentType === 'flights') {
      search();
    } else if (currentType === 'hotels') {
      console.log('Hotels');

      searchHotels();
    }
  }).on('changed.bs.select', 'select.js-search-type-select', function() {
    var type = $('.js-search-type-select').selectpicker('val');
    if (type === 'flights') {
      $('#js-hotel-search').addClass('hidden');
      $('#js-flight-search-inputs-container').removeClass('hidden').find('input').prop('required', true);
    } else {
      $('#js-hotel-search').removeClass('hidden');
      $('#js-flight-search-inputs-container').addClass('hidden').find('input').prop('required', false);
    }
  }).on('click', '.js-hotel-search-icon', function(event) {
    event.preventDefault();
    searchHotels.call(this, true);
  });

  return {
    setForm: setForm,
    searchHotels: searchHotels
  }
}());