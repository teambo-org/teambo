Teambo.socket = (function (t) {
  "use strict";

  var interval;
  var connect;
  var connection;
  var events = [];
  var processing = false;
  var ignored = [];
  var team;

  var processEvent = function(e) {
    return t.promise(function(fulfill, reject) {
      var done = function() {
        t.team.current.lastSeen(e.ts);
        fulfill();
      };
      if(e.type) {
        t.event.all('model-event', e).then(function() {
          done();
        });
      } else if(e.ts) {
        t.time.update(e.ts);
        fulfill();
      } else {
        fulfill();
      }
    });
  };

  var handleEvent = function(e) {
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
      team.queue.process().then(function() {
        processing = false;
      });
    }
  };

  var stop = function() {
    connect = false;
    clearInterval(interval);
    ignored = [];
    team = null;
    if(connection) {
      connection.close();
    }
  };

  var start = function(o) {
    stop();
    team = o;
    if(!team) {
      return;
    }
    var connected = null;
    var failures = 0;
    connect = true;
    var wrapperfunc = function(){
      if (typeof(WebSocket) === "function" && (!connection || connection.readyState > 0)) {
        if(connected) {
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
          t.online(true);
          failures = 0;
          var parts = evt.data.split('-');
          var e = {
            ts   : parts[0],
            type : parts[1],
            id   : parts[2],
            iv   : parts[3]
          };
          if(ignored.indexOf([e.type, e.id, e.iv].join('-')) < 0) {
            handleEvent(e);
          }
        }
      }
    };
    wrapperfunc();
    interval = setInterval(wrapperfunc, (failures < 3 ? 1 : 5)*1000);
  };
  
  var ignore = function(k) {
    ignored = ignored.slice(0, 49);
    ignored.unshift(k);
  };

  return {
    start: start,
    stop: stop,
    ignore: ignore
  };

})(Teambo);
