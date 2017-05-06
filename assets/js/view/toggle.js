Teambo.view.toggle = (function(t){
  "use strict";

  var init = function(selector) {
    var els = document.querySelectorAll(selector + ' a[data-toggle]');
    [].forEach.call(els, function(el) {
      var trigger = el.dataset.toggle;
      var target = document.querySelector(selector + ' [data-toggle-target="'+trigger+'"]');
      el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(target.classList.contains('open')) {
          el.blur();
          target.classList.remove('open');
        } else {
          el.focus();
          target.classList.add('open');
        }
      });
    });
  };

  return {
    init: init
  };

})(Teambo);
