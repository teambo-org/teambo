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
      type: model.type,
      id:   data.id,
      iv:   data.iv,
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
            // Queue for later
            reject(e);
          });
        });
      },
      update: function(opts, auto_refresh) {
        self.opts = t.extend(self.opts, opts);
        return t.promise(function(fulfill, reject) {
          self.save().then(function(xhr) {
            fulfill(self);
          }).catch(function(xhr) {
            if(xhr.status === 409 && auto_refresh) {
              self.refresh().then(function(new_m) {
                new_m.update(self.diff()).then(function(){
                  fulfill(new_m);
                }).catch(function(){
                  reject(xhr);
                });
              });
            } else if(xhr.status === 0) {
              var diff = self.diff();
              self.orig = t.clone(self.opts);
              self.cache().then(function() {
                t.team.current.queue.process({type: model.type + '.offline.update', opts: diff, id: self.id});
                fulfill(self);
              });
            } else {
              self.opts = t.clone(self.orig);
              reject(xhr);
            }
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
            self.uncache().then(function() {
              t.team.current.queue.process({type: model.type + '.offline.remove', id: self.id});
              fulfill();
            });
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
      model.all.sort(function(a, b) {
        return a.opts.name > b.opts.name ? 1 : a.opts.name < b.opts.name ? -1 : 0;
      }).forEach(function(m) {
        ids.push(m.id);
      });
      return ids;
    };

    model.cacheIds = function() {
      return t.team.cache(model.type + '_ids', t.team.encrypt(model.ids()));
    };

    model.create = function(opts, id) {
      return t.promise(function(fulfill, reject) {
        if('schema' in model) {
          var errs = model.schema.validate(opts);
          if(errs.length) {
            reject(errs);
            return;
          }
        }
        var data = {
          team_id: t.team.current.id,
          mkey:    t.team.current.mkey
        };
        if(id) {
          data.id = id;
        }
        t.xhr.post('/'+model.type+'s', {
          data: data
        }).then(function(xhr){
          if(xhr.status == 200) {
            var data = JSON.parse(xhr.responseText);
            var m = new model({
              id:   data.id,
              opts: opts,
              iv:  'new'
            });
            m.orig = {};
            m.save().then(function() {
              model.cacheIds().then(function() {
                fulfill(m);
              });
            }).catch(function(e) {
              reject(e);
            });
          } else if(xhr.status === 409) {
            id = t.crypto.tempKey();
            model.create(opts, id).then(function(m) {
              fulfill(m);
            }).catch(function(e){
              reject(e);
            });
          } else {
            reject(xhr);
          }
        }).catch(function(xhr) {
          if(!id) {
            var id = t.crypto.tempKey();
            var m = new model({id: id, opts: opts});
            m.orig = {};
            m.cache().then(function() {
              model.cacheIds().then(function() {
                t.team.current.queue.process({type: model.type + '.offline.create', opts: opts, id: id});
                fulfill(m);
              });
            });
          } else {
            reject(e);
          }
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
            var team = t.team.current;
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
        var m = model.get(e.id, true);
        if(e.iv === 'removed') {
          if(!m) {
            fulfill();
            return;
          }
          m.uncache().then(function() {
            e[model.type] = m;
            t.view.emit(model.type+'-removed', e);
            // TODO : move updateSideNav someplace else or replace it with something better
            t.view.updateSideNav();
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
              p.push(new_m.cache().then(function() {
                model.cacheIds();
              }));
            }
            Promise.all(p).then(function(){
              e[model.type] = new_m;
              t.view.emit(model.type+'-updated', e);
              // TODO : move updateSideNav someplace else or replace it with something better
              t.view.updateSideNav();
              fulfill();
            }).catch(function() {
              fulfill();
            });
          }).catch(function(err) {
            fulfill();
          });
        }
      });
    });

    t.event.on('team-init', function(team) {
      model.all = [];
      return model.findAll();
    });

    t.event.on('pre-nav', function(route) {
      var k = model.type + '_id';
      if(route && route.data && k in route.data) {
        model.current = model.get(route.data[k]);
      } else {
        model.current = null;
      }
    });

    t.event.on('nav', function(route) {
      if(!route || !route.data) return;
      var els = document.querySelectorAll('a[data-obj^='+model.type+'-]');
      var id = model.type + '_id' in route.data ? route.data[model.type + '_id'] : null;
      for(var i = 0; els[i]; i++) {
        els[i].classList.remove('active');
        if(id && els[i].dataset.obj == model.type+'-'+id) {
          els[i].classList.add('active');
        }
      }
    });

    t.event.on(model.type + '.offline.create', function(e) {
      return t.promise(function(fulfill, reject) {
        model.create(e.opts, e.id).then(function(new_m) {
          new_m.cache().then(function() {
            model.cacheIds();
            e[model.type] = new_m;
            t.view.emit(model.type+'-updated', e);
            fulfill(new_m);
          });
        }).catch(function(e) {
          reject(e);
        });
      });
    });

    t.event.on(model.type + '.offline.update', function(e) {
      return t.promise(function(fulfill, reject) {
        model.find(e.id).then(function(m) {
          if(m) {
            m.refresh().then(function(m) {
              m.update(e.opts, true).then(function(new_m) {
                e[model.type] = new_m;
                t.view.emit(model.type+'-updated', e);
                // TODO : move updateSideNav someplace else or replace it with something better to avoid duplicate calls
                t.view.updateSideNav();
                fulfill();
              }).catch(function(e) {
                reject(e);
              });
            });
          } else {
            fulfill();
          }
        }).catch(function(e) {
          reject(e);
        });
      });
    });

    t.event.on(model.type + '.offline.remove', function(e) {
      return t.promise(function(fulfill, reject) {
        model.find(e.id).then(function(m) {
          if(m) {
            m.remove().then(function() {
              e[model.type] = m;
              t.view.emit(model.type+'-removed', e);
              // TODO : move updateSideNav someplace else or replace it with something better to avoid duplicate calls
              t.view.updateSideNav();
              fulfill();
            }).catch(function(e) {
              t.view.updateSideNav();
              fulfill();
            });
          } else {
            fulfill();
          }
        });
      });
    });

    t.view.set(model.type, model);
  };

  return model;

})(Teambo);
