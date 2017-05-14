Teambo.view.autoselect = (function(t){
  "use strict";

  var init = function(selector, model) {
    var els = document.querySelectorAll(selector);
    [].forEach.call(els, function(el) {
      var opt = el.dataset.opt;
      var trigger = el.querySelector('a.trigger');
      var options = el.querySelector('.options');
      trigger.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        trigger.focus();
        el.classList.add('open');
      });
      trigger.addEventListener('blur', function(e) {
        el.classList.remove('open');
      });
      options.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var a = t.dom.matchParent(e.target, 'a');
        if(!a) return;
        var val = a.dataset.value;
        var data = {};
        data[opt] = val;
        model.update(data, true).then(function() {
          t.view.updateSideNav();
          t.app.refresh();
        });
      });
    });
  };

  return {
    init: init
  };

})(Teambo);
