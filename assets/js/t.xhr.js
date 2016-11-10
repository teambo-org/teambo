Teambo.xhr = (function(t){
  "use strict";

  var xhr = function(method, url, opts) {
    return t.promise(function(fulfill, reject) {
      var x = new(window.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
      if(!t.online()) {
        reject(x);
        return;
      }
      x.open(method, url, 1);
      x.timeout = 'timeout' in opts ? opts.timeout : 5000;
      for(var i in opts.headers) {
        x.setRequestHeader(i, opts.headers[i]);
      }
      x.onreadystatechange = function(){
        if(x.readyState > 3) {
          if(x.status === 0) {
            t.online(false);
          } else {
            t.time.update(x.getResponseHeader('server-time'));
            t.online(true);
          }
          x.status > 0 ? fulfill(x) : reject(x);
        }
      };
      x.send(opts.data);
    });
  }

  var encode_data = function(opts) {
    if(typeof opts.data === 'object') {
      var str = [];
      for(var p in opts.data) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(opts.data[p]));
      }
      opts.data = str.join("&");
      opts.headers = opts.headers ? opts.headers : {};
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return opts;
  }

  t.extend(xhr, {
    get: function(url, opts) {
      opts = opts ? opts : {};
      var alt = encode_data(opts);
      if(alt.data) {
        url = url + (url.indexOf('?') < 0 ? '?' : '&') + alt.data;
      }
      opts.data = null;
      return xhr('GET', url, opts);
    },
    post: function(url, opts) {
      opts = opts ? opts : {};
      opts = encode_data(opts);
      return xhr('POST', url, opts);
    }
  });

  return xhr;

})(Teambo);
