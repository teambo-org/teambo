Teambo.view.history = (function(t){
  "use strict";

  var init = function(model) {
    var trigger = document.getElementById('history-'+model.id+'-trigger');
    var target = document.getElementById('history-'+model.id);
    if(!trigger || !target) {
      return;
    }

    var rendered = false;

    trigger.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if(target.classList.contains('open')) {
        trigger.blur();
        target.classList.remove('open');
      } else if(rendered) {
        trigger.focus();
        target.classList.add('open');
      } else {
        target.innerHTML = t.view.renderTemplate('team/history/_list', model);
        target.classList.add('open');
        t.view.toggle.init('ul.history');
        rendered = true;
      }
    });
  };

  return {
    init: init
  };

})(Teambo);
