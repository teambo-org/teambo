Teambo.socket = (function (t) {
  "use strict";

  var interval;
  var connect;
  var connection;
  var team;
  var events = [];
  var processing = false;
  
  var processEvent = function(e) {
    return t.promise(function(fulfill, reject) {
      var done = function() {
        team.lastSeen(e.ts);
        fulfill();
      };
      if(e.type) {
        if(e.iv === 'removed') {
          var m = t[e.type].get(e.id);
          if(m) {
            m.uncache().then(function() {
              t.event.emit('object-removed', e);
              done();
            });
          } else {
            done();
          }
        } else {
          t[e.type].find(e.id).then(function(m) {
            var p = [];
            if(m && m.iv != e.iv) {
              p.push(m.refresh());
            } else {
              p.push(m.cache());
            }
            Promise.all(p).then(function(){
              t.event.emit('object-updated', e);
              done();
            });
          }).catch(function() {
            done();
          });
        }
      } else {
        done();
      }
    });
  };
  
  var handleEvent = function(e) {
    // TODO: move to t.event?
    if(e) {
      events.push(e);
      if(processing) {
        return;
      }
    }
    var e = events.shift();
    if(e) {
      processing = true;
      if(t.findByProperty(events, 'id', e.id)) {
        setTimeout(handleEvent, 0);
      } else {
        processEvent(e).always(function() {
          setTimeout(handleEvent, 0);
        });
      }
    } else {
      processing = false;
    }
  };
  
  var stop = function() {
    connect = false;
    clearInterval(interval);
    if(connection) {
      connection.close();
    }
  };
  
  var start = function(o) {
    stop();
    if(!o) {
      return;
    }
    team = o;
    var connected = null;
    var failures = 0;
    connect = true;
    var wrapperfunc = function(){
      if (typeof(WebSocket) === "function" && (!connection || connection.readyState > 0)) {
        if(connected) {
          t.online(true);
          return;
        }
        var uri = new Uri(window.location);
        var host = uri.host();
        var scheme = uri.protocol() == 'https' ? 'wss' : 'ws';
        var url = scheme+"://"+host+"/socket?team_id="+team.id+"&mkey="+team.mkey+"&ts="+team.lastSeen();
        connection = new WebSocket(url);
        connected = true;
        connection.onclose = function(evt) {
          failures++;
          connected = false;
          connection = null;
          if(connect) {
            t.online(false);
          }
        }
        connection.onmessage = function(evt) {
          failures = 0;
          var parts = evt.data.split('-');
          var e = {
            ts   : parts[0],
            type : parts[1],
            id   : parts[2],
            iv   : parts[3]
          };
          handleEvent(e);
        }
      }
    };
    wrapperfunc();
    interval = setInterval(wrapperfunc, (failures < 3 ? 1 : 5)*1000);
  };
  
  return {
    start: start,
    stop: stop
  };

})(Teambo);
