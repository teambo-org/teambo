Teambo.form = (function(t){
  "use strict";

  return function(el) {
    var form = el,
      error = form.querySelector('.error'),
      submit = form.querySelector('input[type=submit]');
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      form.error.hide();
      var i, j,
        field;
      var required_fields = form.querySelectorAll('input.required');
      for(i = 0; field = required_fields[i]; i++) {
        if(!field.value) {
          form.error.msg(field.getAttribute('placeholder') + " is required");
          e.stopImmediatePropagation();
          return;
        }
      }
      var min_len_fields = form.querySelectorAll("input[class*='min-len-']"),
        min_len = [];
      for(i = 0; field = min_len_fields[i]; i++) {
        var minlen = 0,
          classname = '';
        for(j = 0; classname = field.classList[j]; j++) {
          if(classname.indexOf('min-len-') === 0) {
            minlen = parseInt(classname.substr(8));
            break;
          }
        }
        if(minlen && field.value.length < minlen) {
          form.error.msg(field.getAttribute('placeholder') + " must be at least "+minlen+" characters");
          e.stopImmediatePropagation();
          return;
        }
      }
    }, false);
    return t.extend(el, {
      error: {
        msg: function(msg, ex) {
          error.innerHTML = (msg ? '<div class="msg">'+msg+'</div>' : '')+(ex ? '<div class="ex">'+ex+'</div>' : '');
          error.style.display = 'block';
        },
        hide: function() {
          error.style.display = 'none';
        }
      },
      disable: function() {
        submit.setAttribute('disabled', 'disabled');
      },
      enable: function() {
        submit.removeAttribute('disabled');
      }
    });
  };

})(Teambo);
