Teambo.offline = (function (t) {
  "use strict";
  
  var queue = function(team) {
    var self = this;
    var events = [];
    var processing = false;
    var cacheKey = t.crypto.sha(team.id+'queue'+t.salt);
    t.extend(this, {
      init:  function() {
        self.wake().then(function(data) {
          if(data) {
            events = data;
          }
        });
      },
      wake: function() {
        return t.promise(function(fulfill, reject) {
          localforage.getItem(cacheKey).then(function(ct) {
            if(ct) {
              fulfill(team.decrypt(ct));
            }
          });
        });
      },
      cache: function() {
        return localforage.setItem(cacheKey, team.encrypt(events));
      },
      processEvent: function(e) {
        return t.promise(function(fulfill, reject) {
          if(e.type) {
            t.event.all(e.type, e).then(function() {
              fulfill();
            }).catch(function() {
              reject();
            });
          } else {
            fulfill();
          }
        });
      },
      process: function(evt) {
        return t.promise(function(fulfill, reject) {
          if(evt) {
            events.push(evt);
            if(processing) {
              fulfill();
              return;
            }
          }
          if(!t.online()) {
            self.cache().then(function() {
              processing = false;
              fulfill();
            });
            return;
          }
          var process = function() {
            var e = events.shift();
            if(e) {
              processing = true;
              self.processEvent(e).then(function() {
                process();
              }).catch(function() {
                events.unshift(e);
                self.cache().then(function() {
                  processing = false;
                  fulfill();
                });
              });
            } else {
              // Mark queue as processed
              self.cache().then(function() {
                processing = false;
                fulfill();
              });
            }
          }
          process();
        });
      },
      length: function() {
        return events.length;
      }
    });
  };
  
  t.event.on('team-init', function(team) {
    return team.queue.init();
  });
  
  return {
    queue: queue,
  };

})(Teambo);
