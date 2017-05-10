Teambo.socket.team = (function (t) {
  "use strict";

  var socket = t.socket.extend({
    url: function() {
      var team = t.team.current;
      if(!team) {
        return
      }
      return "/team/socket?team_id="+team.id+"&mkey="+team.mkey+"&ts="+team.lastSeen()
    }
  });

  var events = [];
  var ignored = [];
  var processing = false;

  socket.ignore = function(k) {
    ignored = ignored.slice(0, 49);
    ignored.unshift(k);
  };

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
      t.team.current.queue.process().then(function() {
        processing = false;
      });
    }
  };

  socket.on('stop', function() {
    ignored = [];
  });

  socket.on('message', function(evt) {
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
  });

  return socket;

})(Teambo);
