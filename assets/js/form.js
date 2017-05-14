Teambo.form = (function(t){
  "use strict";

  var getFieldName = function(field) {
    var name = field.getAttribute('placeholder');
    if(!name) {
      [].forEach.call(field.labels, function(el) {
        name = el.textContent;
      });
    }
    return name;
  };

  return function(el) {
    var form = el;
    var error = form.querySelector('.error');
    var submit_el = form.querySelector('input[type=submit]');
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      form.error.hide();
      var i, j, field;
      var required_fields = form.querySelectorAll('input.required');
      for(i = 0; field = required_fields[i]; i++) {
        if(!field.value) {
          form.error.msg(getFieldName(field) + " is required");
          e.stopImmediatePropagation();
          return;
        }
      }
      var min_len_fields = form.querySelectorAll("input[class*='min-len-']");
      for(i = 0; field = min_len_fields[i]; i++) {
        var minlen = 0;
        var classname = '';
        for(j = 0; classname = field.classList[j]; j++) {
          if(classname.indexOf('min-len-') === 0) {
            minlen = parseInt(classname.substr(8));
            break;
          }
        }
        if(minlen && field.value.length < minlen && (field.value.length > 0 || field.classList.contains('required'))) {
          form.error.msg(getFieldName(field) + " must be at least "+minlen+" characters");
          e.stopImmediatePropagation();
          return;
        }
      }
      var max_len_fields = form.querySelectorAll("input[class*='max-len-'],textarea[class*='max-len-']");
      for(i = 0; field = max_len_fields[i]; i++) {
        var maxlen = 0,
          classname = '';
        for(j = 0; classname = field.classList[j]; j++) {
          if(classname.indexOf('max-len-') === 0) {
            maxlen = parseInt(classname.substr(8));
            break;
          }
        }
        if(maxlen && field.value.length > maxlen) {
          form.error.msg(getFieldName(field) + " must be fewer than "+maxlen+" characters");
          e.stopImmediatePropagation();
          return;
        }
      }
    }, false);

    return t.object.extend(el, {
      error: {
        msg: function(msg, ex) {
          error.innerHTML = t.view.renderTemplate('util/error', {msg: msg, ex: ex});
          error.style.display = 'block';
        },
        hide: function() {
          if(error) {
            error.style.display = 'none';
          }
        }
      },
      disable: function() {
        submit_el.setAttribute('disabled', 'disabled');
      },
      enable: function() {
        submit_el.removeAttribute('disabled');
      },
      values: function(vals) {
        var data = {};
        for(var i in vals) {
          if(form[vals[i]].type === "checkbox") {
            data[vals[i]] = form[vals[i]].checked;
          } else {
            data[vals[i]] = form[vals[i]].value;
          }
        }
        return data;
      },
      serialize: function() {
        var uri = new Uri();
        var els = form.querySelectorAll('input:not([type=submit]), textarea, select');
        [].forEach.call(els, function(el, i) {
          uri.replaceQueryParam(el.name, el.value);
        });
        return uri;
      },
      _submit: function() {
        if(submit_el) {
          submit_el.click();
        } else {
          var button = document.createElement('input');
          button.style.display = 'none';
          button.type = 'submit';
          form.appendChild(button).click();
          form.removeChild(button);
        }
      }
    });
  };

})(Teambo);
