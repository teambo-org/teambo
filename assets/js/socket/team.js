Teambo.socket.team = (function (t) {
  "use strict";

  var socket = new t.socket({
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
  var process = false;
  var processing = false;

  socket.ignore = function(k) {
    ignored = ignored.slice(0, 49);
    ignored.unshift(k);
  };

  var processEvent = function(e) {
    return new Promise(function(fulfill, reject) {
      var done = function() {
        if(t.team.current) {
          t.team.current.lastSeen(e.ts);
        }
        fulfill();
      };
      if(e.type == "log") {
        t.event.all('model-event', e).then(function() {
          done();
        });
      } else if(e.type == "timesync") {
        t.time.update(e.ts);
        fulfill();
      } else if(e.type == "integrity") {
        var ivs = t.model.integrity();
        var hash = t.crypto.sha(ivs.join(""));
        if(hash != e.hash) {
          t.app.log('Integrity hash invalid');
          t.model.integrityCheck(ivs).then(function(iv_events){
            t.app.log('Applying ' + iv_events.length + ' updates from integrity check');
            events = events.concat(iv_events);
            fulfill();
          }).catch(function(e){
            reject();
          });
        } else {
          t.app.log('Integrity hash looks good');
          fulfill();
        }
      } else {
        fulfill();
      }
    });
  };

  var handleEvent = function(e) {
    if(!process) {
      return;
    }
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
      if(t.array.findByProperty(events, 'id', e.id)) {
        processing = false;
        setTimeout(handleEvent, 0);
      } else {
        var callback = function() {
          processing = false;
          setTimeout(handleEvent, 0);
        };
        processEvent(e).then(callback).catch(callback);
      }
    } else {
      t.team.current.queue.process().then(function() {
        processing = false;
      });
    }
  };

  socket.on('start', function() {
    events = [];
    ignored = [];
    process = true;
    processing = false;
  });

  socket.on('stop', function() {
    events = [];
    ignored = [];
    process = false;
    processing = false;
  });

  socket.on('message', function(e) {
    e.team_id = e.channel_id;
    if(e.team_id && e.team_id != t.team.current.id) {
      return;
    }
    if(e.type == "error") {
      handleError(e);
    } else if(ignored.indexOf([e.model, e.id, e.iv].join('-')) < 0) {
      handleEvent(e);
    }
  });

  var handleError = function(e) {
    if(e.code === 403) {
      t.model.uncacheAll().then(function() {
        t.app.replaceUrl('/team-inaccessible', {tid: t.team.current.id});
      });
    } else if(e.code === 404) {
      t.app.replaceUrl('/team-missing', {tid: t.team.current.id});
    } else if(e.code === 500) {
      // do nothing I guess?
    }
  };

  return socket;

})(Teambo);
