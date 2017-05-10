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
      // TODO: Check event type as well as id
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
        var port = uri.port() ? ':' + uri.port() : '';
        var url = scheme+"://"+host+port+"/team/socket?team_id="+team.id+"&mkey="+team.mkey+"&ts="+team.lastSeen();
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
            team_id : parts[0],
            ts      : parts[1],
            type    : parts[2],
            id      : parts[3],
            iv      : parts[4]
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

  t.event.on('team-post-init', function(team) {
    t.socket.start(team);
  });

  return {
    start: start,
    stop: stop,
    ignore: ignore
  };

})(Teambo);
