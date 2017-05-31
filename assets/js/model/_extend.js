Teambo.model._extend = (function(t){
  "use strict";

  var extend = function(model) {
    t.model.types.push(model.type);

    model.prototype = t.model._prototype(model);

    model.all = [];
    model.archives = [];

    model.track_history = true;

    model.aliasProps = model.schema.getAliasProps();

    model.ids = function() {
      var ids = [];
      model.all.sort(model.nameSort).forEach(function(m) {
        ids.push(m.id);
      });
      return ids;
    };

    model.nameSort = function(a, b) {
      if(!a.opts || !b.opts) return -1;
      return a.opts.name > b.opts.name ? 1 : a.opts.name < b.opts.name ? -1 : 0;
    };

    model.getActiveId = function() {
      return model.current ? model.current.id : null;
    };

    model.cacheIds = function() {
      return t.team.cache(model.type + '_ids', t.team.encrypt(model.ids()));
    };

    model.create = function(opts, id) {
      return new Promise(function(fulfill, reject) {
        if('schema' in model) {
          var errs = model.schema.validate(opts, {});
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
        } else {
          data.id = t.crypto.tempKey();
        }
        var m = new model({
          id:   data.id,
          opts: opts
        });
        m.orig = {};
        m.save().then(function(res){
          if(res.id == m.id) {
            model.cacheIds().then(function() {
              fulfill(m);
            });
          } else if(res.status === 409) {
            model.create(opts).then(function(new_m) {
              fulfill(new_m);
            }).catch(reject);
          } else {
            reject(xhr);
          }
        }).catch(function(e) {
          if(!id && e.status === 0) {
            var id = t.crypto.tempKey();
            var m = new model({id: id, opts: opts});
            var member_id = t.acct.current.member().id;
            m.hist.push({iv: t.crypto.iv(), diff: opts, ts: t.time(), member_id: member_id});
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
      return new Promise(function(fulfill, reject) {
        t.xhr.get('/team/'+model.type, {
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
      return new Promise(function(fulfill, reject){
        var team = t.team.current;
        var m = model.get(id, true);
        if(m) {
          fulfill(m);
          return;
        }
        t.team.findCached(model.type+'-'+id).then(function(ct){
          if(ct) {
            var m = new model(ct);
            if(m.id) {
              fulfill(m);
            } else {
              model.uncache(id).then(function() {
                fulfill();
              });
            }
          } else {
            model.fetch(id, team.id, team.mkey).then(function(ct) {
              var new_m = new model(ct);
              if(new_m.id) {
                fulfill(new_m);
              } else {
                // Ciphertext malformed. Push model to quarantine for manual removal?
                // Ignore for now even though integrity cache includes malformed object
                fulfill();
              }
            }).catch(function(xhr) {
              if(xhr.status === 404) {
                model.uncache(id).then(function() {
                  fulfill();
                });
              } else {
                fulfill();
              }
            });
          }
        });
      });
    };

    model.findAll = function(force) {
      return new Promise(function(fulfill, reject) {
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
                if(o && o.id) {
                  ret.push(o);
                }
              }));
            }
            Promise.all(p).then(function() {
              model.all = ret;
              fulfill(ret);
            }).catch(function(e){
              // model.all = ret;
              // fulfill(ret);
              reject(e);
            });
          } else {
            var team = t.team.current;
            if(!team) {
              reject('team not found');
            }
            model.fetchAll(team.id, team.mkey).then(function(data){
              var p = [];
              data.forEach(function(o) {
                var m = new model(o.ct);
                if(m && m.id) {
                  ret.push(m);
                  p.push(m.cache());
                }
              });
              Promise.all(p).then(function() {
                model.all = ret;
                model.cacheIds().then(function() {
                  fulfill(ret);
                });
              }).catch(reject);
            }).catch(reject);
          }
        });
      });
    };

    model.fetchAll = function(team_id, mkey) {
      return new Promise(function(fulfill, reject) {
        t.xhr.get('/team/'+model.type+'s', {
          data: {
            team_id: team_id,
            mkey: mkey
          },
          timeout: 30*1000
        }).then(function(xhr) {
          if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            fulfill(data || []);
          } else {
            reject(xhr);
          }
        }).catch(reject);
      });
    };

    model.uncache = function(id) {
      t.array.deleteByProperty(model.all, 'id', id);
      return new Promise(function (fulfill, reject) {
        t.team.uncache(model.type + '-' + id).then(function() {
          fulfill();
        });
      });
    };

    model.uncacheAll = function() {
      var p = [];
      model.all.forEach(function(m){
        p.push(m.uncache());
      });
      p.push(t.team.uncache(model.type+"_ids"));
      return Promise.all(p);
    };

    t.event.on('model-event', function(e) {
      if(e.model != model.type) return Promise.resolve();
      return new Promise(function(fulfill, reject) {
        var m = model.get(e.id, true);
        if(e.iv === 'removed') {
          if(!m) {
            fulfill();
            return;
          }
          m.uncache().then(function() {
            model.cacheIds().then(function(){
              if(model.type == 'member' && m.opts.pubKey == t.acct.current.rsa.pubTPO().n) {
                t.model.uncacheAll().then(function() {
                  t.app.replaceUrl('/team/inaccessible', {tid: t.team.current.id});
                  fulfill();
                });
                return;
              }
              e[model.type] = m;
              t.view.emit(model.type+'-removed', e);
              // TODO : move updateSideNav someplace else or replace it with something better
              t.view.updateSideNav();
              fulfill();
            });
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
                fulfill();
              }));
            }
            Promise.all(p).then(function(){
              e[model.type] = new_m;
              t.view.emit(model.type+'-updated', e);
              // TODO : move updateSideNav someplace else or replace it with something better
              t.view.updateSideNav();
              fulfill();
            }).catch(function() {
              m.uncache();
              // t.app.trace(e);
              fulfill();
            });
          }).catch(function(e) {
            t.app.trace(e);
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
      return new Promise(function(fulfill, reject) {
        var k = model.type + '_id';
        if(route && route.data && k in route.data) {
          var m = model.get(route.data[k]);
          if(m) {
            model.current = m;
            fulfill();
          } else {
            reject();
          }
        } else {
          model.current = null;
          fulfill();
        }
      });
    });

    t.event.on('nav', function(route) {
      if(!route || !route.data) return;
      var id = model.getActiveId();
      var els = document.querySelectorAll('a[data-obj^='+model.type+'-]');
      for(var i = 0; els[i]; i++) {
        els[i].classList.remove('active');
        if(id && els[i].dataset.obj == model.type+'-'+id) {
          els[i].classList.add('active');
        }
      }
    });

    t.event.on(model.type + '.offline.create', function(e) {
      return new Promise(function(fulfill, reject) {
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
      return new Promise(function(fulfill, reject) {
        model.find(e.id).then(function(m) {
          if(m) {
            m.refresh().then(function(m) {
              m.update(e.opts, true).then(function(new_m) {
                e[model.type] = new_m;
                t.view.emit(model.type+'-updated', e);
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
      return new Promise(function(fulfill, reject) {
        model.find(e.id).then(function(m) {
          if(m) {
            m.remove().then(function() {
              e[model.type] = m;
              t.view.emit(model.type+'-removed', e);
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
  };

  return extend;

})(Teambo);
