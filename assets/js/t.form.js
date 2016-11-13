Teambo.form = (function(t){
  "use strict";

  var autofilter_cache = {};

  return function(el) {
    var form = el,
      error = form.querySelector('.error'),
      submit_el = form.querySelector('input[type=submit]');
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

    var autofilter = function(target, sticky) {
      var tar = document.getElementById(target);
      var uri = new Uri(window.location.hash.slice(1));
      var path = uri.path().split('..')[0];
      var cacheKey = 'filter-'+path
      var submit_fn = function(e) {
        var query = form.serialize();
        t.team.cache('filter-'+path, query.getQueryParams());
        window.location.hash = '#' + path + query;
      };
      form.addEventListener("submit", submit_fn);
      var p = [];
      var data = uri.getQueryParams();
      var filter = function(data) {
        autofilter_cache[cacheKey] = data;
        var els = form.querySelectorAll('select');
        [].forEach.call(els, function(el, i) {
          el.value = data[el.name];
          tar.classList.add('filter-' + el.name + '-' + el.value);
          el.addEventListener('change', function() {
            t.event.once('nav', function() {
              document[form.name][el.name].focus();
            });
            submit_fn();
          });
        });
      };
      if(sticky && Object.keys(data).length === 0) {
        if(cacheKey in autofilter_cache) {
          filter(autofilter_cache[cacheKey]);
        } else {
          t.team.findCached(cacheKey).then(function(val) {
            if(val) {
              filter(val);
            }
          });
        }
      } else {
        filter(data);
      }

      return form;
    };

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
        submit_el.setAttribute('disabled', 'disabled');
      },
      enable: function() {
        submit_el.removeAttribute('disabled');
      },
      values: function(vals) {
        var data = {};
        for(var i in vals) {
          data[vals[i]] = form[vals[i]].value;
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
      autofilter: autofilter,
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
