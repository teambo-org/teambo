Teambo.view.autofilter = (function(t){
  "use strict";

  var autofilter_cache = {};

  var autofilter = function(form, target, sticky) {
    var tar = document.getElementById(target);
    var uri = new Uri(window.location.hash.slice(1));
    var path = uri.path().split('..')[0];
    var cacheKey = 'filter-'+path
    var submit_fn = function() {
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
        if(el.name in data) {
          el.value = data[el.name];
        }
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
          } else {
            filter(data);
          }
        });
      }
    } else {
      filter(data);
    }
    return form;
  };

  return autofilter;

})(Teambo);