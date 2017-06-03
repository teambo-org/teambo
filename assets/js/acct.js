Teambo.acct = (function (t) {
  "use strict";

  var acct = function (data, akey, key) {
    var self = this;
    if (typeof data === 'string') {
      var iv = data.split(' ')[0];
      data = t.crypto.decrypt(data, key);
      data.iv = data.iv ? data.iv : iv;
    }
    t.object.extend(this, {
      id:    data.id,
      iv:    data.iv,
      email: data.email,
      rsa:   data.rsa ? (new RSAKey()).fromPrivTPO(data.rsa) : null,
      opts:  data.opts  || {},
      hist:  data.hist  || [],
      teams: data.teams || [],
      invites: data.invites || [],
      save: function () {
        if (!akey) {
          return Promise.reject('No akey');
        }
        return new Promise(function (fulfill, reject) {
          var iv = t.crypto.iv();
          var new_ct = self.encrypted({iv: iv});
          t.xhr.post('/acct', {
            data: {
              id:   self.id,
              akey: akey,
              ct:   new_ct,
              iv:   self.iv
            }
          }).then(function (xhr) {
            if (xhr.status === 200) {
              self.iv = iv;
              self.cache().then(function() {
                fulfill(xhr);
              });
            } else {
              reject(xhr);
            }
          }).catch(function (e) {
            reject(e);
          });
        });
      },
      changePassword: function(cur_pass, new_pass) {
        if (!cur_pass) return Promise.reject('Current password missing');
        if (!new_pass) return Promise.reject('New password missing');
        return new Promise(function (fulfill, reject) {
          var pkey = t.crypto.pbk(cur_pass, self.id + key + self.id);
          var new_key  = t.crypto.pbk(new_pass, self.email);
          var new_akey = t.crypto.pbk(new_pass, self.id + new_key);
          var new_pkey = t.crypto.pbk(new_pass, self.id + new_key + self.id);
          var iv = t.crypto.iv();
          var new_ct = self.encrypted({iv: iv, key: new_key});
          t.xhr.post('/acct', {
            data: {
              id:       self.id,
              akey:     akey,
              pkey:     pkey,
              new_akey: new_akey,
              new_pkey: new_pkey,
              ct:       new_ct,
              iv:       self.iv
            }
          }).then(function (xhr) {
            if (xhr.status === 200) {
              key = new_key;
              akey = new_akey;
              self.iv = iv;
              self.cache().then(function() {
                fulfill(xhr);
              });
            } else {
              reject(xhr);
            }
          }).catch(function (e) {
            reject(e);
          });
        });
      },
      cache: function () {
        var hash = t.crypto.sha(self.email + t.salt);
        return localforage.setItem(hash, self.encrypted({iv: self.iv}));
      },
      cacheAuth: function() {
        var hash = t.crypto.sha(self.email + t.salt);
        var data = {hash: hash, akey: akey, key: key};
        sessionStorage.setItem('auth', t.crypto.encrypt(data, t.salt));
      },
      rememberMe: function() {
        if(!t.app.rememberme()) {
          return Promise.resolve();
        }
        var hash = t.crypto.sha(self.email + t.salt);
        var data = {hash: hash, akey: akey, key: key};
        return localforage.setItem('auth', t.crypto.encrypt(data, t.salt));
      },
      encrypted: function (opts) {
        opts = opts ? opts : {};
        var data = {
          email: self.email,
          id:    self.id,
          rsa:   self.rsa ? self.rsa.privTPO() : null,
          teams: self.teams,
          invites: self.invites,
          opts:  self.opts
        };
        var config = {};
        if(opts.iv) {
          data.iv   = opts.iv;
          config.iv = opts.iv;
        }
        return self.encrypt(data, opts, config);
      },
      encrypt: function (data, opts, config) {
        opts = opts ? opts : {};
        return t.crypto.encrypt(data, opts.key ? opts.key : key, config);
      },
      decrypt: function (ct) {
        return t.crypto.decrypt(ct, key);
      },
      team_list: function () {
        var k,
          ret = [];
        for (k in self.teams) {
          ret.push(self.teams[k]);
        }
        return ret;
      },
      rsaTest: function(key) {
        var test_key     = (new RSAKey()).fromPrivTPO(key.privTPO());
        var test_pub_key = (new RSAKey()).fromPubTPO(key.pubTPO());
        return test_key.decrypt(test_pub_key.encrypt('test')) == 'test';
      },
      genrsa: function (progress, attempts) {
        return new Promise(function(fulfill, reject) {
          if(self.rsa) {
            return fulfill(self.rsa);
          }
          var key = new RSAKey();
          key.generateAsync(2048, (65537).toString(16), function() {
            if(self.rsaTest(key)) {
              self.rsa = key;
              fulfill(key);
            } else if(!attempts || attempts < 10) {
              self.genrsa(progress, attempts ? attempts + 1 : 1).then(function(key){
                fulfill(key)
              }, reject);
            } else {
              reject('could not generate rsa key');
            }
          }, progress);
        });
      },
      member: function() {
        var pubKey = self.rsa.pubTPO().n;
        var r = null;
        t.model.member.all.forEach(function(m){
          if(m.opts.pubKey === pubKey) {
            r = m;
          }
        });
        return r;
      },
      socketUrl: function() {
        return "/acct/socket?id="+encodeURIComponent(self.id)+"&akey="+encodeURIComponent(akey);
      },
      refresh: function(iv) {
        if(self.iv == iv) {
          return Promise.resolve();
        }
        return new Promise(function (fulfill, reject) {
          t.xhr.post('/acct/auth', {
            data: {id: self.id, akey: akey}
          }).then(function(xhr) {
            if(xhr.status == 200) {
              var data = JSON.parse(xhr.responseText);
              if(data) {
                var new_acct = new acct(data.ct, akey, key);
                new_acct.cache().then(function(){
                  fulfill(new_acct);
                });
              } else {
                reject(xhr);
              }
            }
          }).catch(function(xhr) {
            reject(xhr);
          });
        });
      },
      addTeam: function(team, retry) {
        if(t.array.findByProperty(self.teams, 'id', team.id)) {
          return Promise.resolve();
        }
        if(team.admin && t.array.findAllByProperty(self.teams, 'admin', true).length >= t.app.max_teams) {
          return Promise.reject("Accounts are currently limited to " + t.app.max_teams + " teams");
        }
        return new Promise(function(fulfill, reject) {
          self.teams.push(team);
          self.save().then(function(){
            fulfill(self);
          }).catch(function(e) {
            if(!retry && e.status && e.status === 409) {
              self.refresh().then(function(new_acct) {
                new_acct.addTeam(team, true).then(function(new_acct){
                  fulfill(new_acct);
                });
              }).catch(reject);
            } else {
              reject(e);
            }
          });
        });
      },
      removeTeam: function(team, retry) {
        if(!t.array.findByProperty(self.teams, 'id', team.id)) {
          return Promise.resolve();
        }
        return new Promise(function(fulfill, reject) {
          t.array.deleteByProperty(self.teams, 'id', team.id);
          self.save().then(function(){
            fulfill(self);
          }).catch(function(e) {
            if(!retry && e.status && e.status === 409) {
              self.refresh().then(function(new_acct) {
                new_acct.removeTeam(team, true).then(function(new_acct){
                  fulfill(new_acct);
                });
              }).catch(reject);
            } else {
              reject(e);
            }
          });
        });
      },
      hasTeam: function(team_id) {
        return t.array.findByProperty(self.teams, 'id', team_id);
      }
    });
  };

  acct.current = null;

  acct.init = function () {
    // Session hopping - Too many race conditions and edge cases
    // window.onbeforeunload = function(){
      // acct.deAuth();
    // };
    return acct.wake();
  };

  acct.wake = function () {
    var callback = function(auth) {
      if(!auth) return Promise.resolve();
      return new Promise(function (fulfill, reject) {
        localforage.getItem(auth.hash).then(function (ct) {
          var data = t.crypto.decrypt(ct, auth.key);
          if (data) {
            acct.current = new acct(data, auth.akey, auth.key);
            // Session hopping
            // sessionStorage.removeItem('auth');
            fulfill();
          } else {
            fulfill();
          }
        });
      });
    };
    var auth = sessionStorage.getItem('auth');
    if (auth) {
      auth = t.crypto.decrypt(auth, t.salt);
      return callback(auth);
    } else {
      return new Promise(function(fulfill, reject) {
        localforage.getItem('auth').then(function(auth) {
          auth = t.crypto.decrypt(auth, t.salt);
          callback(auth).then(function() {
            fulfill();
          }).catch(function() {
            fulfill();
          });
        });
      });
    }
  };

  acct.isAuthed = function () {
    return acct.current !== null;
  };

  acct.deAuth = function () {
    acct.current = null;
    sessionStorage.removeItem('auth');
    return localforage.removeItem('auth');
  };

  acct.auth = function (email, pass) {
    var id   = t.crypto.sha(email);
    var key  = t.crypto.pbk(pass, email);
    var akey = t.crypto.pbk(pass, id + key);
    return new Promise(function (fulfill, reject) {
      if(t.app.online) {
        var p = t.xhr.post('/acct/auth', {
          data: {id: id, akey: akey}
        });
      } else {
        var p = Promise.reject();
      }
      p.then(function (xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          if (!data || !data.ct) {
            reject(xhr);
          }
          acct.current = new acct(data.ct, akey, key);
          acct.current.cache();
          acct.current.cacheAuth();

        }
        fulfill(xhr);
      }).catch(function (xhr) {
        acct.auth.offline(email, pass).then(function (a) {
          acct.current = a;
          acct.current.cacheAuth();
          fulfill(true);
        }).catch(function () {
          reject(xhr);
        });
      });
    });
  };

  acct.auth.offline = function (email, pass) {
    var id   = t.crypto.sha(email);
    var hash = t.crypto.sha(email + t.salt);
    var key  = t.crypto.pbk(pass, email);
    var akey = t.crypto.pbk(pass, id + key);
    return new Promise(function (fulfill, reject) {
      localforage.getItem(hash).then(function (item) {
        var data = t.crypto.decrypt(item, key);
        if (data) {
          fulfill(new acct(data, akey, key));
        } else {
          reject();
        }
      });
    });
  };

  return acct;

})(Teambo);
