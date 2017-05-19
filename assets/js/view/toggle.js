Teambo.view.toggle = (function(t){
  "use strict";

  var toggle = {};

  toggle.init = function(selector) {
    var event_object = t.event.extend({});
    var els = document.querySelectorAll(selector + ' a[data-toggle], '+selector+' i[data-toggle]');
    [].forEach.call(els, function(el) {
      var trigger = el.dataset.toggle;
      var target = document.querySelector(selector + ' [data-toggle-target="'+trigger+'"]');
      el.addEventListener('mousedown', function(e) {
        if(e.which !== 1) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if(target.classList.contains('open')) {
          el.blur();
          target.classList.remove('open');
          event_object.emit('toggled', {name: trigger, open: false});
        } else {
          el.focus();
          target.classList.add('open');
          event_object.emit('toggled', {name: trigger, open: true});
        }
      });
    });
    return event_object;
  };

  return toggle;

})(Teambo);
