Teambo.team = (function(t){
  "use strict";

  var socket_interval = null;

  var team = function(data, mkey, key) {
    var self = this;
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
      save: function() {
        if(!mkey) {
          return Promise.reject('No mkey');
        }
        return t.promise(function(fulfill, reject) {
          var new_ct = self.encrypted();
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
        localforage.setItem(hash, self.encrypted(self.iv));
      },
      encrypted: function(iv) {
        var data = {
          id:   self.id,
          opts: self.opts,
          hist: self.hist
        };
        if(iv) {
          data.iv = iv;
        }
        return self.encrypt(data);
      },
      encrypt: function(data, config) {
        return t.crypto.encrypt(data, key, config);
      },
      decrypt: function(ct) {
        return t.crypto.decrypt(ct, key);
      },
      bucket_list: function() {
        return t.bucket.all;
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
      receiveEvent: function(e) {
        var parts = e.data.split('-');
        if(parts[1]) {
          var ts   = parts[0];
          var type = parts[1];
          var id   = parts[2];
          var iv   = parts[3];
          if(iv === 'removed') {
            var m = t[type].get(id);
            if(m) {
              var bucket_id = m.opts.bucket_id;
              m.uncache().then(function() {
                t.view.updateSideNav();
                // TODO: move to event listener
                var bucket = t.view.get('bucket');
                var item   = t.view.get('item');
                if(type == 'bucket' && bucket && bucket.id == id) {
                  t.gotoUrl(t.team.current.url());
                  // show message
                } else if(type == 'item' && bucket && bucket.id == bucket_id && (!item || item.id == id)) {
                  t.gotoUrl(bucket.url());
                  // show message
                }
              });
            }
          } else {
            t[type].find(id).then(function(m) {
              if(m && m.iv != iv) {
                m.refresh().then(function() {
                  t.view.updateSideNav();
                  // TODO: move to event listener
                  var bucket = t.view.get('bucket');
                  var item   = t.view.get('item');
                  if(type == 'bucket' && bucket && bucket.id == id) {
                    if(!t.editing()) {
                      t.refresh();
                    } else {
                      // show message
                    }
                  } else if(type == 'item' && bucket && bucket.id == m.opts.bucket_id && (!item || item.id == m.id)) {
                    if(!t.editing()) {
                      t.refresh();
                    } else {
                      // show message
                    }
                  }
                });
              }
            });
          }
        }
        console.log(e.data);
      },
      startSocket: function(team_id) {
        var connected = null;
        var connection = null;
        var wrapperfunc = function(){
          if (typeof(WebSocket) === "function" && (!connection || connection.readyState > 0)) {
            if(connected) {
              t.online(true);
              return;
            }
            var uri = new Uri(window.location);
            var host = uri.host();
            var scheme = uri.protocol() == 'https' ? 'wss' : 'ws';
            connection = new WebSocket(scheme+"://"+host+"/socket?team_id="+self.id+"&mkey="+self.mkey);
            connected = true;
            connection.onclose = function(evt) {
              connected = false;
              connection = null;
              t.online(false);
            }
            connection.onmessage = function(e) {
              self.receiveEvent(e);
            }
          }
        };
        wrapperfunc();
        socket_interval = setInterval(wrapperfunc, 1000);
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
