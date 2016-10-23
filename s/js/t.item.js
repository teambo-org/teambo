Teambo.item = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    if(typeof data == 'string') {
      var iv = data.split(' ')[0];
      data = t.team.decrypt(data);
      data.iv = data.iv ? data.iv : iv;
    }
    t.extend(this, {
      id: data.id,
      iv: data.iv,
      opts: data.opts ? data.opts : {},
      hist: data.hist ? data.hist : [],
      save: function() {
        return t.promise(function(fulfill, reject) {
          var new_ct = self.encrypted();
          t.xhr.post('/item', {
            data: {
              team_id: t.team.current.id,
              mkey: t.team.current.mkey,
              item_id: self.id,
              ct: new_ct,
              iv: self.iv
            }
          }).then(function(xhr){
            if(xhr.status == 200) {
              self.iv = new_ct.split(' ')[0];
              self.cache().then(function() {
                fulfill(self);
              });
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
            self.cache().then(function(o){
              fulfill(o);
            });
          }).catch(function(e) {
            self.opts = orig_opts;
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
          model.cacheIds().then(function(){
            t.team.cache(self.id, self.encrypted(self.iv)).then(function(){
              fulfill(self);
            });
          });
        });
      },
      uncache: function() {
        t.deleteByProperty(model.all, 'id', self.id);
        return t.promise(function (fulfill, reject) {
          model.cacheIds().then(function(){
            t.team.uncache(self.id).then(function() {
              fulfill(self);
            });
          });
        });
      },
      remove: function() {
        return t.promise(function(fulfill, reject) {
          t.xhr.post('/item/remove', {
            data: {
              team_id: t.team.current.id,
              mkey:    t.team.current.mkey,
              item_id: self.id
            }
          }).then(function(xhr){
            if(xhr.status == 204) {
              self.uncache().then(function(){
                fulfill();
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
          opts: self.opts
        };
        if(iv) {
          data.iv = iv;
        }
        return t.team.encrypt(data);
      },
      status: function() {
        return model.statuses[self.opts.status];
      }
    });
  };

  model.all = [];

  model.cacheIds = function() {
    var ids = [];
    model.all.forEach(function(m) {
      ids.push(m.id);
    });
    return t.team.cache("items", t.team.encrypt(ids));
  };

  model.create = function(opts) {
    return t.promise(function(fulfill, reject) {
      t.xhr.post('/items', {
        data: {
          team_id: t.team.current.id,
          mkey:    t.team.current.mkey
        }
      }).then(function(xhr){
        if(xhr.status == 200) {
          var data = JSON.parse(xhr.responseText);
          var item = new model({
            id:   data.id,
            opts: opts,
            iv:  'new'
          });
          item.save().then(function(xhr){
            fulfill(item);
          }).catch(function(e){
            reject(e);
          });
        } else {
          reject(xhr);
        }
      }).catch(function(e){
        // Save item create event
        // Apply item create event
        reject(e);
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

  model.getByBucket = function(bucket_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.bucket_id == bucket_id) {
        ret.push(o);
      }
    }
    return ret;
  };

  model.find = function(id) {
    return t.promise(function(fulfill, reject){
      var team = t.team.current;
      t.team.findCached(id).then(function(ct){
        if(ct) {
          fulfill(new model(ct));
        } else {
          model.fetch(id, team.id, team.mkey).then(function(ct) {
            fulfill(new model(ct));
          }).catch(function(e) {
            reject(e);
          });
        }
      });
    });
  };
  model.fetch = function(id, team_id, mkey) {
    return t.promise(function(fulfill, reject) {
      t.xhr.get('/item', {
        data: {
          team_id: team_id,
          mkey: mkey,
          item_id: id
        }
      }).then(function(xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          fulfill(data.ct);
        } else {
          reject(xhr);
        }
      });
    });
  };

  model.findAll = function() {
    return t.promise(function(fulfill, reject) {
      if(model.all.length) {
        fulfill(model.all);
        return;
      }
      var team = t.team.current;
      t.team.findCached("items").then(function(ct){
        var ret = [];
        if(ct) {
          var ids = t.team.decrypt(ct);
          var p = [];
          for(var i in ids) {
            if(!ids[i]) continue;
            p.push(model.find(ids[i]).then(function(o){
              ret.push(o);
            }));
          }
          Promise.all(p).then(function() {
            model.all = ret;
            fulfill(ret);
          }).catch(function(e){
            reject(e);
          });
        } else {
          model.fetchAll(team.id, team.mkey).then(function(data){
            var cp = [];
            data.forEach(function(o) {
              var m = new model(o.ct);
              ret.push(m);
              cp.push(m.cache());
            });
            Promise.all(cp).then(function() {
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
      t.xhr.get('/items', {
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

  model.findByBucket = function(bucket_id) {
    return t.promise(function(fulfill, reject) {
      model.findAll().then(function(items){
        var ret = [];
        for(var i in items) {
          if(items[i].opts.bucket_id == bucket_id) {
            ret.push(items[i]);
          }
        }
        fulfill(ret);
      }).catch(function(e){
        reject(e);
      });
    });
  };

  model.statuses = {
    ready : {
      label: 'Ready',
      icon: 'check-empty'
    },
    blocked : {
      label: 'Blocked',
      icon: 'attention'
    },
    inprogress : {
      label: 'In Progress',
      icon: 'child'
    },
    qa: {
      label: 'Under QA',
      icon: 'sliders'
    },
    complete : {
      label: 'Complete',
      icon: 'ok-squared'
    }
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
