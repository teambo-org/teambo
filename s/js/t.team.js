Teambo.team = (function(t){
  "use strict";

  var socket_interval = null;
  var socket_connect = true;

  var team = function(data, mkey, key) {
    var self = this;
    var connection = null;
    if(typeof data == 'string') {
      var iv = data.split(' ')[0];
      data = t.crypto.decrypt(data, key);
      data.iv = data.iv ? data.iv : iv;
    }
    t.extend(this, {
      id: data.id,
      iv: data.iv,
      mkey: mkey,
      opts: data.opts ? data.opts : {},
      hist: data.hist ? data.hist : [],
      last_seen: data.last_seen ? data.last_seen : 0,
      save: function() {
        if(!mkey) {
          return Promise.reject('No mkey');
        }
        return t.promise(function(fulfill, reject) {
          var iv = t.crypto.iv();
          var new_ct = self.encrypted({iv: iv});
          t.xhr.post('/team', {
            data: {
              team_id: self.id,
              mkey: mkey,
              ct: new_ct,
              iv: self.iv
            }
          }).then(function(xhr){
            if(xhr.status == 200) {
              self.iv = new_ct.split(' ')[0];
              self.cache();
              fulfill(xhr);
            } else {
              reject(xhr);
            }
          }).catch(function(e){
            reject(e);
          });
        });
      },
      update: function(opts) {
        var orig_opts = t.clone(self.opts);
        self.opts = t.extend(self.opts, opts);
        return t.promise(function(fulfill, reject) {
          self.save().then(function(xhr) {
            fulfill(self)
          }).catch(function(e) {
            self.opts = orig_opts;
            reject(e);
          });
        });
      },
      cache: function() {
        var hash = t.crypto.sha(self.id+t.salt);
        localforage.setItem(hash, self.encrypted({last_seen: self.last_seen}));
      },
      encrypted: function(override) {
        var override = override ? override : {};
        var data = {
          id:   self.id,
          opts: self.opts,
          hist: self.hist,
          iv:   self.iv
        };
        t.extend(data, override);
        return self.encrypt(data);
      },
      encrypt: function(data, config) {
        return t.crypto.encrypt(data, key, config);
      },
      decrypt: function(ct) {
        return t.crypto.decrypt(ct, key);
      },
      bucket_list: function() {
        var extra = [];
        if(t.item.hasOrphaned()) {
          extra.push(t.bucket.orphaned);
        }
        return t.bucket.all.concat(extra);
      },
      theme: function() {
        if(typeof(self.opts.theme) === "object") {
          return self.opts.theme;
        } else if(typeof(self.opts.theme) === "string" && self.opts.theme in t.themes) {
          return t.themes[self.opts.theme];
        } else {
          return t.themes['Default'];
        }
      },
      url: function() {
        return '/'+data.id;
      },
      lastSeen: function(ts) {
        ts = parseInt(ts);
        if(ts && ts > self.last_seen || ts === 0) {
          self.last_seen = ts;
          self.cache();
        }
        return self.last_seen;
      },
      receiveEvent: function(evt) {
        return new Promise(function(fulfill, reject) {
          var parts = evt.data.split('-');
          var done = function() {
            self.lastSeen(parts[0]);
            fulfill();
          };
          if(parts[1]) {
            var e = {
              ts   : parts[0],
              type : parts[1],
              id   : parts[2],
              iv   : parts[3]
            };
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
              });
            }
          } else {
            done();
          }
        });
      },
      startSocket: function() {
        var connected = null;
        var failures = 0;
        socket_connect = true;
        var wrapperfunc = function(){
          if (typeof(WebSocket) === "function" && (!connection || connection.readyState > 0)) {
            if(connected) {
              t.online(true);
              return;
            }
            var uri = new Uri(window.location);
            var host = uri.host();
            var scheme = uri.protocol() == 'https' ? 'wss' : 'ws';
            var url = scheme+"://"+host+"/socket?team_id="+self.id+"&mkey="+self.mkey+"&ts="+self.lastSeen();
            connection = new WebSocket(url);
            connected = true;
            connection.onclose = function(evt) {
              failures++;
              connected = false;
              connection = null;
              initial_sync_complete = false;
              if(socket_connect) {
                t.online(false);
              }
            }
            connection.onmessage = function(e) {
              failures = 0;
              receiveEvents(e);
            }
          }
        };
        var initial_sync_complete = false;
        var received_events = [];
        var initial_sync_timeout;
        var receiveEvents = function(evt) {
          if(evt) {
            received_events.push(evt);
          }
          if(initial_sync_complete) {
            self.receiveEvent(evt);
          } else {
            clearTimeout(initial_sync_timeout);
            initial_sync_timeout = setTimeout(processInitialSync, 200);
          }
        };
        var processInitialSync = function() {
          initial_sync_complete = true;
          var deduped_evts = {};
          received_events.forEach(function(e, i) {
            var parts = e.data.split('-');
            if(parts.length > 1) {
              var type = parts[1];
              var id   = parts[2];
              deduped_evts[type+id] = e;
            }
          });
          received_events = [];
          var sorted_events = [];
          for(var i in deduped_evts) {
            sorted_events.push(deduped_evts[i]);
          }
          sorted_events.sort();
          sorted_events.forEach(function(e) {
            self.receiveEvent(e);
          });
        };
        wrapperfunc();
        socket_interval = setInterval(wrapperfunc, (failures < 3 ? 1 : 5)*1000);
      },
      closeSocket: function() {
        socket_connect = false;
        clearInterval(socket_interval);
        if(connection) {
          connection.close();
        }
      }
    });
  };

  team.current = null;

  team.init = function(id) {
    return t.promise(function(fulfill, reject){
      t.acct.current.team.find(id).then(function(o) {
        team.current = o;
        t.item.all = [];
        t.bucket.all = [];
        var p = [];
        p.push(t.bucket.findAll());
        p.push(t.item.findAll());
        o.startSocket();
        Promise.all(p).then(function() {
          fulfill(o);
        }).catch(function(e) {
          reject(e);
        });
      });
    });
  };

  team.create = function(name) {
    return t.promise(function(fulfill, reject) {
      t.xhr.post('/team').then(function(xhr){
        if(xhr.status == 200) {
          var data = JSON.parse(xhr.responseText);
          var key  = t.crypto.randomKey();
          var acct = t.acct.current;
          var new_team = new team({
            id: data.team.id,
            iv: 'new',
            opts: {
              name: name,
              theme: 'Default'
            }
          }, data.mkey, key);
          new_team.save().then(function(){
            acct.team.add(new_team.id, data.mkey, key);
            acct.save().then(function(){
              fulfill(new_team);
            }).catch(function(e){
              reject(e);
            });
          }).catch(function(e){
            acct.team.remove(new_team.id);
            reject(e);
          });
        } else {
          reject(xhr);
        }
      }).catch(function(e){
        reject(e);
      });
    });
  };

  team.findCached = function(id, ct) {
    if(!team.current) return Promise.reject();
    var hash = t.crypto.sha(team.current.id+id+t.salt);
    return localforage.getItem(hash);
  };

  team.cache = function(id, ct) {
    if(!team.current) return Promise.reject();
    var hash = t.crypto.sha(team.current.id+id+t.salt);
    return localforage.setItem(hash, ct);
  };

  team.uncache = function(id) {
    if(!team.current) return Promise.reject();
    var hash = t.crypto.sha(team.current.id+id+t.salt);
    return localforage.removeItem(hash);
  };

  team.encrypt = function(data, config) {
    if(!team.current) return null;
    return team.current.encrypt(data, config);
  };

  team.decrypt = function(ct) {
    if(!team.current) return null;
    return team.current.decrypt(ct);
  };

  // t.event.register('bucket-create', {
    // apply: function(events, obj) {
      // if(events.length > 0) {
        // return Promise.reject();
      // }
      // team.buckets.find(obj.id).then(function(bucket){
        // if(!bucket) {
          // var b = new t.bucket(obj);
          // b.cache();
          // team.buckets.add({id: obj.id});
          // return Promise.resolve();
        // }
      // });
    // }
  // });

  return team;

})(Teambo);
