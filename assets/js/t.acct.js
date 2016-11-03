Teambo.acct = (function (t) {
  "use strict";

  var acct = function (data, akey, key) {
    var self = this;
    if (typeof data === 'string') {
      var iv = data.split(' ')[0];
      data = t.crypto.decrypt(data, key);
      data.iv = data.iv ? data.iv : iv;
    }
    t.extend(this, {
      id:    data.id,
      email: data.email,
      opts:  data.opts  || {},
      hist:  data.hist  || [],
      teams: data.teams || [],
      save: function () {
        if (!akey) {
          return Promise.reject('No akey');
        }
        return t.promise(function (fulfill, reject) {
          var new_ct = self.encrypted();
          t.xhr.post('/acct', {
            data: {
              id:   self.id,
              akey: akey,
              ct:   self.encrypted(),
              iv:   self.iv
            }
          }).then(function (xhr) {
            if (xhr.status === 200) {
              self.iv = new_ct.split(' ')[0];
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
        sessionStorage.setItem('auth', JSON.stringify({hash: hash, akey: akey, key: key}));
      },
      encrypted: function (iv) {
        var data = {
          email: self.email,
          id:    self.id,
          key:   key,
          akey:  akey,
          teams: self.teams,
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
      team: {
        add: function (id, mkey, key) {
          return id && self.teams.push({id: id, mkey: mkey, key: key});
        },
        remove: function (id) {
          return id && t.deleteByProperty(self.teams, 'id', id);
        },
        all: function () {
          return t.promise(function (fulfill, reject) {
            var ret = [],
              p = [];
            self.teams.forEach(function (v) {
              p.push(t.promise(function(fulfill, reject) {
                self.team.find(v.id).then(function(found_team) {
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
        },
        find: function (id) {
          return t.promise(function (fulfill, reject) {
            var d = t.findByProperty(self.teams, 'id', id);
            if (!d) {
              reject();
              return;
            }
            localforage.getItem(t.crypto.sha(id + t.salt)).then(function (ct) {
              if (ct) {
                fulfill(new t.team(ct, d.mkey, d.key));
              } else {
                self.team.fetch(id, d.mkey).then(function(ct) {
                  var fetched_team = new t.team(ct, d.mkey, d.key);
                  fetched_team.cache();
                  fulfill(fetched_team);
                }).catch(function(e) {
                  reject(e);
                });
              }
            });
          });
        },
        refresh: function(id) {
          return t.promise(function (fulfill, reject) {
            var d = t.findByProperty(self.teams, 'id', id);
            if (!d) {
              reject();
              return;
            }
            self.team.fetch(id, d.mkey).then(function(ct) {
              var new_team = new t.team(ct, d.mkey, d.key);
              new_team.cache().then(function(){
                fulfill(new_team);
              });
            }).catch(function(e) {
              reject(e);
            });
          });
        },
        fetch: function(id, mkey) {
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
        }
      }
    });
  };

  acct.current = null;

  acct.init = function () {
    return acct.wake();
  };

  acct.wake = function () {
    var auth = sessionStorage.getItem('auth');
    if (auth) {
      auth = JSON.parse(auth);
      return t.promise(function (fulfill, reject) {
        localforage.getItem(auth.hash).then(function (ct) {
          var data = t.crypto.decrypt(ct, auth.key);
          if (data) {
            acct.current = new acct(data, auth.akey, auth.key);
            sessionStorage.removeItem('auth');
            fulfill();
          } else {
            reject();
          }
        });
      });
    } else {
      return Promise.resolve();
    }
  };

  acct.isAuthed = function () {
    return acct.current !== null;
  };

  acct.deAuth = function () {
    t.view.set('acct', null);
    acct.current = null;
    sessionStorage.removeItem('auth');
  };

  acct.auth = function (email, pass) {
    var id   = t.crypto.sha(email);
    var key  = t.crypto.pbk(pass, email);
    var akey = t.crypto.pbk(pass, id + key);
    return t.promise(function (fulfill, reject) {
      if(t.online()) {
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
          t.view.set('acct', acct.current);
        }
        fulfill(xhr);
      }).catch(function (xhr) {
        acct.auth.offline(email, pass).then(function (a) {
          acct.current = a;
          t.view.set('acct', acct.current);
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
    return t.promise(function (fulfill, reject) {
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
      return t.promise(function (fulfill, reject) {
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
      return t.promise(function (fulfill, reject) {
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
