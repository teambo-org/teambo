Teambo.team = (function(t){
  "use strict";

  var team = function(data, mkey, key) {
    var self = this;
    if(typeof data == 'string') {
      var iv = data.split(' ')[0];
      data = t.crypto.decrypt(data, key);
      data.iv = data.iv ? data.iv : iv;
    }
    t.object.extend(this, {
      id: data.id,
      iv: data.iv,
      mkey: mkey,
      orig: data.opts ? t.object.clone(data.opts) : {},
      opts: data.opts ? data.opts : {},
      hist: data.hist ? data.hist : [],
      last_seen: data.last_seen ? data.last_seen : 0,
      admin: data.admin ? data.admin : false,
      encrypt: function(data, config) {
        return t.crypto.encrypt(data, key, config);
      },
      decrypt: function(ct) {
        return t.crypto.decrypt(ct, key);
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
      isAdmin: function() {
        return self.admin;
      },
      queue: new t.offline.queue(this)
    });
  };

  team.prototype = {
    save: function() {
      if(!this.mkey) {
        return Promise.reject('No mkey');
      }
      var self = this;
      return new Promise(function(fulfill, reject) {
        var errs = team.schema.validate(self.opts, self.orig);
        if(errs.length) {
          reject(errs);
          return;
        }
        var iv = t.crypto.iv();
        var new_ct = self.encrypted({iv: iv});
        t.socket.team.ignore(['team', self.id, iv].join('-'));
        t.xhr.post('/team', {
          data: {
            team_id: self.id,
            mkey: self.mkey,
            ct: new_ct,
            iv: self.iv
          }
        }).then(function(xhr){
          if(xhr.status == 200) {
            self.iv = iv;
            self.orig = t.object.clone(self.opts);
            self.cache();
            fulfill(xhr);
          } else {
            reject(xhr);
          }
        }).catch(reject);
      });
    },
    update: function(opts) {
      t.object.extend(this.opts, opts);
      var self = this;
      return new Promise(function(fulfill, reject) {
        self.save().then(function(xhr) {
          fulfill(self);
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
            self.opts = t.object.clone(self.orig);
            reject(e);
          }
        });
      });
    },
    remove: function(name) {
      if(name != this.opts.name || !t.app.online) {
        return Promise.reject();
      }
      var self = this;
      return new Promise(function(fulfill, reject) {
        var data = {
          team_id: t.team.current.id,
          mkey:    t.team.current.mkey
        };
        t.xhr.post('/team/remove', {
          data: data
        }).then(function(xhr){
          if(xhr.status == 204) {
            var p = [];
            t.model.types.forEach(function(type){
              p.push(t.model[type].uncacheAll());
            });
            Promise.all(p).then(function() {
              self.uncache().then(function(){
                t.array.deleteByProperty(t.acct.current.teams, 'id', self.id);
                t.acct.current.save().then(function(){
                  fulfill();
                });
              });
            });
          } else {
            reject(xhr);
          }
        }).catch(reject);
      });
    },
    cache: function() {
      return localforage.setItem(this.sha(), this.encrypted({last_seen: this.last_seen, admin: this.admin}));
    },
    uncache: function() {
      return localforage.removeItem(this.sha());
    },
    encrypted: function(override) {
      var override = override ? override : {};
      var data = {
        id:    this.id,
        opts:  this.opts,
        hist:  this.hist,
        iv:    this.iv
      };
      t.object.extend(data, override);
      var config = {};
      if(override.iv) {
        config.iv = override.iv;
      }
      return this.encrypt(data, config);
    },
    rsaTPO: function(pubKey) {
      var rsa = new RSAKey();
      var e = 65537;
      rsa.setPublic(t.crypto.b64tohex(pubKey), e.toString(16));
      return t.crypto.hextob64(rsa.encrypt(this.id+'-'+key));
    },
    init: function() {
      return team.init(this.id);
    },
    getSummary: function() {
      if(!this.last_seen) {
        return Promise.resolve();
      }
      var self = this;
      return new Promise(function(fulfill, reject) {
        t.xhr.get('/team/summary', {
          data: {
            team_id: self.id,
            mkey: self.mkey,
            ts: self.last_seen
          }
        }).then(function(xhr) {
          if(xhr.status == 200) {
            team.summaries[self.id] = JSON.parse(xhr.responseText);
          }
          fulfill();
        }).catch(fulfill);
      });
    },
    lastSeen: function(ts) {
      if(ts && ts > self.last_seen || ts === 0) {
        this.last_seen = ts;
        this.cache();
      }
      return self.last_seen;
    },
    diff: function() {
      var diff = {};
      for(var i in this.opts) {
        if(this.orig[i] != this.opts[i]) {
          diff[i] = this.opts[i];
        }
      }
      return diff;
    },
    isCached: function() {
      var self = this;
      return new Promise(function(fulfill, reject) {
        var hash = self.sha('item_ids');
        localforage.getItem(hash).then(function(ct) {
          if(ct) {
            fulfill();
          } else {
            reject();
          }
        });
      });
    },
    summary: function() {
      return team.summaries[this.id];
    },
    sha: function(args) {
      args = args ? args : [];
      var cacheKey = [t.salt, t.acct.current.id, this.id].concat(args).join('-');
      return t.crypto.sha(cacheKey);
    }
  };

  team.current = null;

  team.reset = function(id) {
    team.current = null;
    t.view.unset('team');
    t.model.all = [];
    t.socket.team.stop();
    t.socket.inviteResponse.stop();
  };

  team.summaries = {};

  team.schema = new t.schema({
    name:  { type: "string", required: true,  minLength: 1, maxLength: 256 },
    theme: { type: "string", required: false, maxLength: 32 }
  });

  team.init = function(id) {
    return new Promise(function(fulfill, reject){
      team.find(id).then(function(o) {
        team.current = o;
        t.event.all('team-init', o).then(function() {
          fulfill(o);
        }).catch(reject);
      }).catch(reject);
    });
  };

  var createFirstMember = function(team, member_id) {
    return new Promise(function(fulfill, resolve) {
      t.team.current = team;
      var member = new t.model.member({
        id: member_id,
        iv: "new",
        opts: {
          pubKey: t.acct.current.rsa.pubTPO().n,
          email:  t.acct.current.email
        }
      });
      member.save().then(function(m) {
        t.model.member.uncacheAll().then(function() {
          t.team.current = null;
          fulfill(m);
        });
      });
    });
  };

  team.create = function(name) {
    return new Promise(function(fulfill, reject) {
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
            acct.teams.push({id: new_team.id, mkey: data.mkey, key: key, admin: true});
            acct.save().then(function(){
              createFirstMember(new_team, data.member_id).then(function() {
                fulfill(new_team);
              });
            }).catch(reject);
          }).catch(function(e){
            t.array.deleteByProperty(acct.teams, 'id', new_team.id);
            reject(e);
          });
        } else {
          reject(xhr);
        }
      }).catch(reject);
    });
  };

  team.find = function (id) {
    return new Promise(function (fulfill, reject) {
      var d = t.array.findByProperty(t.acct.current.teams, 'id', id);
      if (!d) {
        reject();
        return;
      }
      var args = [t.salt, t.acct.current.id, id].join('-');
      var cacheKey = t.crypto.sha(args);
      localforage.getItem(cacheKey).then(function (ct) {
        if (ct) {
          fulfill(new team(ct, d.mkey, d.key));
        } else {
          team.fetch(id, d.mkey).then(function(data) {
            if(data.team) {
              // TODO: Add 'admin' parameter to API endpoint and collect it here
              var fetched_team = new team(data.team.ct, d.mkey, d.key);
              fetched_team.admin = data.admin;
              fetched_team.cache().then(function() {
                fulfill(fetched_team);
              });
            } else {
              reject();
            }
          }).catch(reject);
        }
      });
    });
  };

  team.findAll = function () {
    var acct = t.acct.current;
    if(!acct) return Promise.reject();
    return new Promise(function (fulfill, reject) {
      var ret = [];
      var p = [];
      acct.teams.forEach(function (v) {
        p.push(new Promise(function(fulfill, reject) {
          team.find(v.id).then(function(found_team) {
            ret.push(found_team);
            fulfill();
          }).catch(function() {
            ret.push(new team.missing(v));
            fulfill();
          });
        }));
      });
      Promise.all(p).then(function() {
        ret = ret.sort(function(a, b) {
          return a.opts.name > b.opts.name ? 1 : (a.opts.name === b.opts.name ? 0 : -1);
        });
        fulfill(ret);
      }).catch(reject);
    });
  };

  team.missing = function(data) {
    return {
      id: data.id,
      opts: {
        name: 'Missing'
      },
      missing: true,
      theme: t.themes['Slate Red']
    };
  };

  team.fetch = function(id, mkey) {
    return new Promise(function(fulfill, reject) {
      t.xhr.get('/team', {
        data: {
          team_id: id,
          mkey: mkey
        }
      }).then(function(xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          fulfill(data);
        } else {
          reject("Failed to retrieve team " + id);
        }
      }).catch(reject);
    });
  };

  team.refresh = function(id) {
    var acct = t.acct.current;
    if(!acct) return Promise.reject();
    return new Promise(function (fulfill, reject) {
      var d = t.array.findByProperty(acct.teams, 'id', id);
      if (!d) {
        reject();
        return;
      }
      team.fetch(id, d.mkey).then(function(data) {
        var new_team = new team(data.team.ct, d.mkey, d.key);
        new_team.cache().then(function(){
          fulfill(new_team);
        });
      }).catch(function(xhr) {
        reject(xhr);
      });
    });
  };

  team.findCached = function(key) {
    if(!team.current) return Promise.reject();
    var hash = team.current.sha(key);
    return localforage.getItem(hash);
  };

  team.cache = function(key, ct) {
    if(!team.current) return Promise.reject();
    var hash = team.current.sha(key);
    return localforage.setItem(hash, ct);
  };

  team.uncache = function(key) {
    if(!team.current) return Promise.reject();
    var hash = team.current.sha(key);
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
    if(e.model != 'team') return Promise.resolve();
    return new Promise(function(fulfill, reject) {
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
            t.app.gotoUrl("/account");
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
