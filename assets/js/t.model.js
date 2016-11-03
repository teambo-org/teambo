Teambo.model = (function(t){
  "use strict";

  var model = function(data, model) {
    var self = this;
    if(typeof data == 'string') {
      var iv = data.split(' ')[0];
      data = t.team.decrypt(data);
      data.iv = data.iv ? data.iv : iv;
    }
    t.extend(this, {
      id: data.id,
      iv: data.iv,
      orig: data.opts ? t.clone(data.opts) : {},
      opts: data.opts ? data.opts : {},
      hist: data.hist ? data.hist : [],
      save: function() {
        return t.promise(function(fulfill, reject) {
          if('schema' in model) {
            var errs = model.schema.validate(data.opts);
            if(errs.length) {
              reject(errs);
              return;
            }
          }
          var diff = self.diff();
          if(!Object.keys(diff).length) {
            fulfill(self);
            return;
          }
          var iv = t.crypto.iv();
          // TODO: Add member id to history items
          self.hist.push({iv: iv, diff: diff, ts: t.time()/*, mid: member.id */});
          var new_ct = self.encrypted(iv);
          t.socket.ignore([model.type, self.id, iv].join('-'));
          t.xhr.post('/'+model.type, {
            data: {
              team_id: t.team.current.id,
              mkey: t.team.current.mkey,
              id: self.id,
              ct: new_ct,
              iv: self.iv
            }
          }).then(function(xhr){
            if(xhr.status == 200) {
              self.iv = iv;
              self.orig = t.clone(self.opts);
              self.cache().then(function() {
                fulfill(self);
              });
            } else {
              t.deleteByProperty(self.hist, 'iv', iv);
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
            fulfill(self);
          }).catch(function(e) {
            self.opts = t.clone(self.orig);
            reject(e);
          });
        });
      },
      refresh: function() {
        return t.promise(function (fulfill, reject) {
          var d = t.team.current;
          model.fetch(self.id, d.id, d.mkey).then(function(ct) {
            var m = new model(ct);
            m.cache().then(function(m){
              fulfill(m);
            });
          }).catch(function(e) {
            reject(e);
          });
        });
      },
      cache: function() {
        return t.promise(function (fulfill, reject) {
          var updated = false;
          model.all.forEach(function(m, i) {
            if(m.id == self.id) {
              model.all[i] = self;
              updated = true;
            }
          });
          if(!updated) {
            model.all.push(self);
          }
          t.team.cache(self.id, self.encrypted()).then(function(){
            fulfill(self);
          });
        });
      },
      uncache: function() {
        t.deleteByProperty(model.all, 'id', self.id);
        return t.promise(function (fulfill, reject) {
          t.team.uncache(self.id).then(function() {
            fulfill(self);
          });
        });
      },
      remove: function() {
        return t.promise(function(fulfill, reject) {
          t.xhr.post('/'+model.type+'/remove', {
            data: {
              team_id: t.team.current.id,
              mkey:    t.team.current.mkey,
              id:      self.id
            }
          }).then(function(xhr){
            if(xhr.status == 204 || xhr.status == 404) {
              self.uncache().then(function(){
                model.cacheIds().then(function(){
                  fulfill();
                });
              });
            } else {
              reject(xhr);
            }
          }).catch(function(e){
            reject(e);
          });
        });
      },
      encrypted: function(iv) {
        var data = {
          id:   self.id,
          opts: self.opts,
          hist: self.hist,
          iv:   self.iv
        };
        var config = {};
        if(iv) {
          data.iv = iv;
          config.iv = iv;
        }
        return t.team.encrypt(data, config);
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
      active: function() {
        return model.current && model.current.id == self.id ? 'active' : '';
      }
    });
  };

  model.extend = function(model) {
    model.all = [];

    model.ids = function() {
      var ids = [];
      model.all.forEach(function(m) {
        ids.push(m.id);
      });
      return ids;
    };

    model.cacheIds = function() {
      return t.team.cache(model.type + '_ids', t.team.encrypt(model.ids()));
    };

    model.create = function(opts) {
      return t.promise(function(fulfill, reject) {
        if('schema' in model) {
          var errs = model.schema.validate(opts);
          if(errs.length) {
            reject(errs);
            return;
          }
        }
        t.xhr.post('/'+model.type+'s', {
          data: {
            team_id: t.team.current.id,
            mkey:    t.team.current.mkey
          }
        }).then(function(xhr){
          if(xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            var m = new model({
              id:   data.id,
              opts: opts,
              iv:  'new'
            });
            m.orig = {};
            m.save().then(function(xhr){
              model.cacheIds().then(function(){
                fulfill(m);
              });
            }).catch(function(e){
              reject(e);
            });
          } else {
            reject(xhr);
          }
        }).catch(function(e){
          // Save model create event
          // Apply model create event
          reject(e);
        });
      });
    };

    model.fetch = function(id, team_id, mkey) {
      return t.promise(function(fulfill, reject) {
        t.xhr.get('/'+model.type, {
          data: {
            team_id: team_id,
            mkey: mkey,
            id: id
          }
        }).then(function(xhr) {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            fulfill(data.ct);
          } else {
            reject(xhr);
          }
        }).catch(function(xhr) {
          reject(xhr);
        });
      });
    };

    model.get = function(id) {
      for(var i in model.all) {
        var o = model.all[i];
        if(o.id == id) {
          return o;
        }
      }
    };

    model.find = function(id) {
      return t.promise(function(fulfill, reject){
        var team = t.team.current;
        var m = model.get(id, true);
        if(m) {
          fulfill(m);
          return;
        }
        t.team.findCached(id).then(function(ct){
          if(ct) {
            fulfill(new model(ct));
          } else {
            model.fetch(id, team.id, team.mkey).then(function(ct) {
              fulfill(new model(ct));
            }).catch(function(e) {
              fulfill();
            });
          }
        });
      });
    };

    model.findAll = function(force) {
      return t.promise(function(fulfill, reject) {
        if(model.all.length) {
          fulfill(model.all);
          return;
        }
        var team = t.team.current;
        t.team.findCached(model.type+'_ids').then(function(ct){
          var ret = [];
          if(ct && !force) {
            var ids = t.team.decrypt(ct);
            var p = [];
            for(var i in ids) {
              if(!ids[i]) continue;
              p.push(model.find(ids[i]).then(function(o){
                if(o) {
                  ret.push(o);
                }
              }));
            }
            Promise.all(p).then(function() {
              model.all = ret;
              fulfill(ret);
            }).catch(function(e){
              model.all = ret;
              fulfill(ret);
              // reject(e);
            });
          } else {
            model.fetchAll(team.id, team.mkey).then(function(data){
              var p = [];
              data.forEach(function(o) {
                var m = new model(o.ct);
                ret.push(m);
                p.push(m.cache());
              });
              Promise.all(p).then(function() {
                model.all = ret;
                model.cacheIds().then(function() {
                  fulfill(ret);
                });
              });
            }).catch(function(e){
              reject(e);
            });
          }
        });
      });
    };

    model.fetchAll = function(team_id, mkey) {
      return t.promise(function(fulfill, reject) {
        t.xhr.get('/'+model.type+'s', {
          data: {
            team_id: team_id,
            mkey: mkey
          }
        }).then(function(xhr) {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            fulfill(data || []);
          } else {
            reject(xhr);
          }
        });

      });
    };

    t.event.on('model-event', function(e) {
      if(e.type != model.type) return Promise.resolve();
      return t.promise(function(fulfill, reject) {
        var m = model.get(e.id);
        if(e.iv === 'removed') {
          if(!m) {
            fulfill();
            return;
          }
          m.uncache().then(function() {
            t.event.emit('object-removed', e);
            fulfill();
          });
        } else {
          if(m && m.iv == e.iv) {
            fulfill();
            return;
          }
          model.find(e.id).then(function(new_m) {
            var p = [];
            if(new_m && new_m.iv != e.iv) {
              p.push(m.refresh());
            } else if(new_m && !m){
              p.push(m.cache());
            }
            Promise.all(p).then(function(){
              t.event.emit('object-updated', e);
              fulfill();
            }).catch(function() {
              fulfill();
            });
          }).catch(function() {
            fulfill();
          });
        }
      });
    });

    t.event.on('team-init', function(e) {
      model.all = [];
      return model.findAll();
    });

    t.event.on('pre-nav', function(route) {
      var k = model.type + '_id';
      if(k in route.data) {
        model.current = model.get(route.data[k]);
      } else {
        model.current = null;
      }
    });

    t.event.on('nav', function(route) {
      if(!route) return;
      var els = document.querySelectorAll('a[data-obj^='+model.type+'-]');
      var id = model.type + '_id' in route.data ? route.data[model.type + '_id'] : null;
      for(var i = 0; els[i]; i++) {
        els[i].classList.remove('active');
        if(id && els[i].dataset.obj == model.type+'-'+id) {
          els[i].classList.add('active');
        }
      }
    });

    t.view.set(model.type, model);
  };

  return model;

  // t.event.register('item-create', {
    // apply: function(events, obj) {
      // if(events.length > 0) {
        // return Promise.reject();
      // }
      // t.items.find(obj.id).then(function(item){
        // if(!item) {
          // var b = new t.item(obj);
          // b.cache();
          // t.items.add({id: obj.id});
          // return Promise.resolve();
        // }
      // });
    // }
  // });

  // Create event
  // Apply event
  // Persist event

})(Teambo);
