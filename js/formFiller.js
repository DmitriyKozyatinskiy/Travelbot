var FormFiller = (function() {
  'use strict';

  function setForm(settings, data) {
    var $tab;

    if (settings.tab) {
      $tab = $(settings.tab);
      $tab.trigger('click');
    }

    var interval = window.setInterval(function() {
      if ($tab) {
        $tab.trigger('click');
      }
      setData(settings, data, interval, $tab);
    }, 500);
  }

  function setData(settings, data, interval, $tab) {
    console.log('settings: ', settings);
    console.log('data: ', data);
    var startDateInput = $(settings.startDateInput);
    if (startDateInput) {
      if (data.type === 'flights') {
        $(settings.fromInput).val(data.codes[0]);
        $(settings.toInput).val(data.codes[1]);
      } else if (data.type === 'hotels') {
        $(settings.locationInput).val(data.location);
      }

      startDateInput.removeClass('flightsStartDate');
      startDateInput.val(moment(data.dates[0], 'DD-MM-YYYY').format(settings.datePattern));

      if (settings.startDateText) {
        $(settings.startDateText).html(moment(data.dates[0], 'DD-MM-YYYY').format(settings.textDatePattern));
      }

      if (data.dates[1]) {
        var endDateInput = $(settings.endDateInput);
        endDateInput.removeClass('flightsEndDate');
        endDateInput.val(moment(data.dates[1], 'DD-MM-YYYY').format(settings.datePattern));
        if (settings.endDateText) {
          $(settings.endDateText).html(moment(data.dates[1], 'DD-MM-YYYY').format(settings.textDatePattern))
        }
      }

      // refreshDates(settings);
      window.setTimeout(function () {
        console.log('TAB: ', $tab);
        $tab.trigger('click');
      }, 1000);
      window.clearInterval(interval);
    }
  }

  function refreshDates(settings) {
    $(settings.startDateInput).click();
    if (settings.endDateInput) {
      $(settings.endDateInput).click();
    }
  }
  
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.fillForm) {
      setForm(request.fillForm.settings, request.fillForm.data);
    }
  });

  return {
    setForm: setForm
  }
}());