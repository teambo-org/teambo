Teambo.time = (function(t){
  "use strict";

  var offset = 0;

  var local = function() {
    return Date.parse(new Date().toUTCString()) + new Date().getUTCMilliseconds();
  };

  var update = function(server_ts) {
    if(typeof server_ts === 'string') {
      server_ts = parseInt(server_ts.substr(0, 13));
    }
    if(!server_ts || typeof server_ts !== 'number') return;
    return offset = server_ts - local();
  };

  var time = function() {
    return local() + offset;
  };

  t.object.extend(time, {
    getOffset: function() {
      return offset;
    },
    update: update
  });

  return time;

})(Teambo);
