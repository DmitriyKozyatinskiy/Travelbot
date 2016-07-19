var Search = (function() {
  'use strict';

  var $searchFormContainer = $('#js-search-form-container');

  function search() {
    var dfd = $.Deferred();
    var codes = [$('#js-search-from').attr('data-value'), $('#js-search-to').attr('data-value')];
    var dates = [$('#js-search-from-date').val(), $('#js-search-to-date').val() || ''];
    var data = {
      codes: codes,
      dates: dates
    };

    UrlGenerator.getCurrentPageUrl().done(function(currentUrl) {
      var searchUrl = UrlGenerator.generateFlightUrl(data, currentUrl);
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {searchUrl: searchUrl}, function() {
          dfd.resolve();
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
            $spinner.removeClass('hidden');
          }
        }).done(function(data) {
          if (data.status) {
            response( $.map( data.airports, function( item ) {
              return {
                label: item.name + ' (' + item.iata + ')',
                value: item.name + ' (' + item.iata + ')',
                code: item.iata
              }
            }));
          } else {
            response();
          }
        }).always(function() {
          $spinner.addClass('hidden');
        });
      },
      select: function(event, ui) {
        var $input = $(this);
        $input.attr('data-value', ui.item.code);
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
    search();
  });

  return {
    setForm: setForm
  }
}());