var Search = (function() {
  'use strict';

  var $searchFormContainer = $('#js-search-form-container');

  // function search() {
  //   var dfd = $.Deferred();
  //   var codes = [$('#js-search-from').val(), $('#js-search-to').val()];
  //   var dates = [$('#js-search-from-date').val(), $('#js-search-to-date').val() || ''];
  //   var data = {
  //     codes: codes,
  //     dates: dates,
  //     type: 'flights'
  //   };
  //
  //   UrlGenerator.getCurrentPageUrl().done(function(currentUrl) {
  //     var searchUrl = UrlGenerator.generateFlightUrl(data, currentUrl);
  //     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  //       chrome.tabs.sendMessage(tabs[0].id, { searchUrl: searchUrl }, function() {
  //         dfd.resolve();
  //       });
  //     });
  //   });
  //
  //   return dfd.promise();
  // }
  
  function setForm() {
    var dfd = $.Deferred();

    $.get('../html/searchForm.html', function (formTemplate) {
      $searchFormContainer.html(formTemplate);
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

  function getSearchData(type) {
    var data;
    if (type === 'flights') {
      data = {
        codes: [$('#js-search-from').val(), $('#js-search-to').val()]
      };
    } else if (type === 'hotels') {
      data = {
        location: $('#js-hotel-search').val()
      };
    }
    data.dates = [$('#js-search-from-date').val(), $('#js-search-to-date').val() || ''];
    data.type = type;

    return data;
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
    var data = getSearchData(currentType);

    chrome.runtime.sendMessage({ search:  { data: data, type: currentType } }, function(response) {});
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
    var data = getSearchData('hotels');
    chrome.runtime.sendMessage({ search:  { data: data, type: 'hotels' } }, function(response) {});
  });

  return {
    setForm: setForm
  }
}());