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
              ct:   self.encrypted(),
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
      cache: function () {
        var hash = t.crypto.sha(self.email + t.salt);
        return localforage.setItem(hash, self.encrypted(self.iv));
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
      encrypted: function (iv) {
        var data = {
          email: self.email,
          id:    self.id,
          rsa:   self.rsa ? self.rsa.privTPO() : null,
          key:   key,
          akey:  akey,
          teams: self.teams,
          invites: self.invites,
          opts:  self.opts
        };
        if(iv) {
          data.iv = iv;
        }
        return self.encrypt(data);
      },
      encrypt: function (data) {
        return t.crypto.encrypt(data, key);
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
      genrsa: function (progress, attempts) {
        return new Promise(function(fulfill, reject) {
          if(self.rsa) {
            return fulfill(self.rsa);
          }
          var key = new RSAKey();
          key.generateAsync(2048, (65537).toString(16), function() {
            if(key.decrypt(key.encrypt('test')) === 'test') {
              self.rsa = key;
              fulfill(key);
            } else if(attempts && attempts < 10) {
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
        if(!iv || self.iv == iv) {
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
      }
    });
  };

  acct.current = null;

  acct.init = function () {
    return acct.wake();
  };

  acct.wake = function () {
    var callback = function(auth) {
      return new Promise(function (fulfill, reject) {
        localforage.getItem(auth.hash).then(function (ct) {
          var data = t.crypto.decrypt(ct, auth.key);
          if (data) {
            acct.current = new acct(data, auth.akey, auth.key);
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

  acct.verification = {
    send : function (email, pass, bypass) {
      if(!email || !pass) {
        return Promise.reject();
      }
      var id   = t.crypto.sha(email);
      var key  = t.crypto.pbk(pass, email);
      var akey = t.crypto.pbk(pass, id + key);
      return new Promise(function (fulfill, reject) {
        var xhr_data = {
          email: email,
          akey:  akey
        };
        if(bypass) {
          xhr_data.bypass = 'true';
        }
        t.xhr.post('/acct/verification', {
          data: xhr_data
        }).then(function (xhr){
          var data = JSON.parse(xhr.responseText);
          if(xhr.status == 201) {
            if(bypass && 'vkey' in data) {
              acct.verification.confirm(data.vkey, email, pass).then(function(){
                fulfill(xhr);
              });
            } else {
              localforage.setItem('verification', {
                email: email,
                id:   id,
                key:  key,
                akey: akey
              });
              fulfill(xhr);
            }
          } else {
            reject(xhr);
          }
        });
      });
    },
    confirm : function(vkey, email, pass) {
      var id, key, akey;
      return new Promise(function (fulfill, reject) {
        var send_confirmation = function () {
          t.xhr.post('/acct/verification', {
            data: {id: id, akey: akey, vkey: vkey}
          }).then(function (xhr){
            if(xhr.status == 200) {
              localforage.removeItem('verification');
              acct.current = new acct({
                email: email,
                id:    id,
                teams: [],
                opts:  {}
              }, akey, key);
              acct.current.save().then(function (xhr){
                fulfill(xhr);
              }).catch(function (e) {
                reject(e);
              });
            } else {
              reject(xhr);
            }
          }).catch(function (e) {
            reject(e);
          });
        };
        if (!email || !pass) {
          localforage.getItem('verification').then(function (v) {
            if(v) {
              email = v.email;
              id    = v.id;
              key   = v.key;
              akey  = v.akey;
              send_confirmation();
            } else {
              reject("Verification not found");
            }
          });
        } else {
          id   = t.crypto.sha(email);
          key  = t.crypto.pbk(pass, email);
          akey = t.crypto.pbk(pass, id + key);
          send_confirmation();
        }
      });
    }
  };

  return acct;

})(Teambo);
