Teambo.view.autoselect = (function(t){
  "use strict";

  var init = function(selector, model, callback, focus_opt) {
    var els = document.querySelectorAll(selector);
    [].forEach.call(els, function(el) {
      var opt = el.dataset.opt;
      var trigger = el.querySelector('a.trigger');
      var options = el.querySelector('.options');
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // trigger.focus();
        options.firstElementChild.focus();
        el.classList.add('open');
      });
      // trigger.addEventListener('blur', function(e) {
        // el.classList.remove('open');
      // });
      var blurfn = function(e) {
        var a = t.dom.matchParent(e.target, '.options');
        if(!a) {
          el.classList.remove('open');
        }
      };
      document.addEventListener('focusin', blurfn);
      document.addEventListener('click', blurfn);
      options.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var a = t.dom.matchParent(e.target, 'a');
        if(!a) return;
        var val = a.dataset.value;
        var data = {};
        data[opt] = val;
        if(model) {
          if(model.id) {
            model.update(data, true).then(function() {
              t.view.updateSideNav();
              t.app.refresh();
            });
          } else {
            el.classList.remove('open');
            if(callback) {
              callback(opt, val);
            }
          }
        } else {
          el.classList.remove('open');
        }
      });
      if(focus_opt == opt) {
        trigger.focus();
      }
    });
  };

  return {
    init: init
  };

})(Teambo);
