Teambo.team = (function(t){
  "use strict";

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
      orig: data.opts ? t.clone(data.opts) : {},
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
          t.socket.ignore(['team', self.id, iv].join('-'));
          t.xhr.post('/team', {
            data: {
              team_id: self.id,
              mkey: mkey,
              ct: new_ct,
              iv: self.iv
            }
          }).then(function(xhr){
            if(xhr.status == 200) {
              self.iv = iv;
              self.orig = t.clone(self.opts);
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
        self.opts = t.extend(self.opts, opts);
        return t.promise(function(fulfill, reject) {
          self.save().then(function(xhr) {
            fulfill(self)
          }).catch(function(xhr) {
            if(xhr.status === 409) {
              var opts = t.team.current.opts;
              team.refresh(self.id).then(function(new_m){
                new_m.update(self.diff()).then(function(){
                  fulfill(new_m);
                }).catch(function(){
                  reject(xhr);
                });
              });
            } else {
              self.opts = t.clone(self.orig);
              reject(e);
            }
          });
        });
      },
      cache: function() {
        t.trace(self.iv);
        var hash = t.crypto.sha(self.id+t.salt);
        return localforage.setItem(hash, self.encrypted({last_seen: self.last_seen}));
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
        var config = {};
        if(override.iv) {
          config.iv = override.iv;
        }
        return self.encrypt(data, config);
      },
      encrypt: function(data, config) {
        return t.crypto.encrypt(data, key, config);
      },
      decrypt: function(ct) {
        return t.crypto.decrypt(ct, key);
      },
      diff: function() {
        var diff = {};
        for(var i in self.opts) {
          if(self.orig[i] != self.opts[i]) {
            diff[i] = self.opts[i];
          }
        }
        return diff;
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
      }
    });
  };

  team.current = null;

  team.init = function(id) {
    return t.promise(function(fulfill, reject){
      team.find(id).then(function(o) {
        team.current = o;
        t.event.all('team-init', o).then(function() {
          t.socket.start(o);
          fulfill(o);
        }).catch(function(e) {
          reject(e);
        });
      }).catch(function() {
        reject();
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
          new_team.orig = {};
          new_team.save().then(function(){
            acct.teams.push({id: new_team.id, mkey: data.mkey, key: key});
            acct.save().then(function(){
              fulfill(new_team);
            }).catch(function(e){
              reject(e);
            });
          }).catch(function(e){
            t.deleteByProperty(acct.teams, 'id', new_team.id)
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

  team.find = function (id) {
    return t.promise(function (fulfill, reject) {
      var d = t.findByProperty(t.acct.current.teams, 'id', id);
      if (!d) {
        reject();
        return;
      }
      localforage.getItem(t.crypto.sha(id + t.salt)).then(function (ct) {
        if (ct) {
          fulfill(new team(ct, d.mkey, d.key));
        } else {
          team.fetch(id, d.mkey).then(function(ct) {
            var fetched_team = new team(ct, d.mkey, d.key);
            fetched_team.cache().then(function() {
              fulfill(fetched_team);
            });
          }).catch(function(e) {
            reject(e);
          });
        }
      });
    });
  };

  team.findAll = function () {
    var acct = t.acct.current;
    if(!acct) return Promise.reject();
    return t.promise(function (fulfill, reject) {
      var ret = [],
        p = [];
      acct.teams.forEach(function (v) {
        p.push(t.promise(function(fulfill, reject) {
          team.find(v.id).then(function(found_team) {
            ret.push(found_team);
            fulfill();
          }).catch(function(e) {
            reject(e);
          });
        }));
      });
      Promise.all(p).then(function() {
        fulfill(ret);
      });
    });
  };

  team.fetch = function(id, mkey) {
    return t.promise(function(fulfill, reject) {
      t.xhr.get('/team', {
        data: {
          team_id: id,
          mkey: mkey
        }
      }).then(function(xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          fulfill(data.team.ct);
        } else {
          reject("Failed to retrieve team " + id);
        }
      });
    });
  };
  
  team.refresh = function(id) {
    var acct = t.acct.current;
    if(!acct) return Promise.reject();
    return t.promise(function (fulfill, reject) {
      var d = t.findByProperty(acct.teams, 'id', id);
      if (!d) {
        reject();
        return;
      }
      team.fetch(id, d.mkey).then(function(ct) {
        console.log(ct);
        var new_team = new team(ct, d.mkey, d.key);
        new_team.cache().then(function(){
          fulfill(new_team);
        });
      }).catch(function(xhr) {
        reject(xhr);
      });
    });
  };

  team.findCached = function(id) {
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
  
  t.event.on('model-event', function(e) {
    if(e.type != 'team') return Promise.resolve();
    return t.promise(function(fulfill, reject) {
      var m = team.find(e.id, true);
      if(e.iv === 'removed') {
        if(!m) {
          fulfill();
          return;
        }
        m.uncache().then(function() {
          e['team'] = m;
          t.view.emit('team-removed', e);
          if(t.team.current && e.id == t.team.current.id) {
            t.gotoUrl("/account");
          }
        });
      } else {
        if(m && m.iv == e.iv) {
          fulfill();
          return;
        }
        team.refresh(e.id).then(function(new_m) {
          e['team'] = new_m;
          if(t.team.current && e.id == t.team.current.id) {
            t.team.current = new_m;
            t.view.set('team', new_m);
            t.view.updateSideNav();
            t.view.updateTheme();
          }
          t.view.emit('team-updated', e);
          fulfill();
        }).catch(function(err) {
          fulfill();
        });
      }
    });
  });

  return team;

})(Teambo);
