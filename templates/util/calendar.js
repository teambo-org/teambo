function(t){
  "use strict";

  var cal = t.view.calendar;
  var active = cal.firstChild.dataset.active || "null";
  var today = cal.firstChild.dataset.today || "null";
  [].forEach.call(cal.querySelectorAll('[data-date="'+active+'"]'), function(el) {
    el.classList.add('active');
  });
  [].forEach.call(cal.querySelectorAll('[data-date="'+today+'"]'), function(el) {
    el.classList.add('today');
  });
}
