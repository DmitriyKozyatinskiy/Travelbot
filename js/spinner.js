var Loader = (function() {
  'use strict';

  var $body = $('body');
  var spinnerContainer = document.getElementById('js-spinner');
  var $spinnerContainer = $(spinnerContainer);
  var spinnerOptions = {
    lines: 13 // The number of lines to draw
    , length: 28 // The length of each line
    , width: 14 // The line thickness
    , radius: 42 // The radius of the inner circle
    , scale: 0.25 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#000' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '40%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
  };

  function show() {
    $body.addClass('no-events');
    $spinnerContainer.removeClass('hidden');
    new Spinner(spinnerOptions).spin(spinnerContainer);
  }

  function hide() {
    $spinnerContainer.empty().addClass('hidden');
    $body.removeClass('no-events');
  }

  return {
    show: show,
    hide: hide
  }
}());
