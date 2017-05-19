Teambo.model._prototype = (function(t){
  "use strict";

  var _prototype = function(model) {
    return {
      save: function() {
        var self = this;
        return new Promise(function(fulfill, reject) {
          if('schema' in model) {
            var errs = model.schema.validate(self.opts, self.orig);
            if(errs.length) {
              reject(errs);
              return;
            }
          }
          var diff = model.schema.diff(self.orig, self.opts);
          if(!Object.keys(diff).length) {
            fulfill(self);
            return;
          }
          var iv = t.crypto.iv();
          var member = t.acct.current.member();
          if(member) {
            self.hist.push({iv: iv, diff: diff, ts: t.time(), member_id: member.id});
          }
          var new_ct = self.encrypted(iv);
          t.socket.team.ignore([model.type, self.id, iv].join('-'));
          t.xhr.post('/team/'+model.type, {
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
              self.orig = t.object.clone(self.opts);
              self.cache().then(function() {
                fulfill(self);
              });
            } else {
              t.array.deleteByProperty(self.hist, 'iv', iv);
              reject(xhr);
            }
          }).catch(function(e){
            // Queue for later
            reject(e);
          });
        });
      },
      update: function(opts, auto_refresh) {
        var self = this;
        t.object.extend(self.opts, opts);
        return new Promise(function(fulfill, reject) {
          self.save().then(function(xhr) {
            fulfill(self);
          }).catch(function(xhr) {
            if(xhr.status === 409 && auto_refresh) {
              self.refresh().then(function(new_m) {
                var diff = model.schema.diff(new_m.opts, opts);
                new_m.update(diff).then(function(){
                  fulfill(new_m);
                }).catch(function(){
                  reject(xhr);
                });
              });
            } else if(xhr.status === 0) {
              var diff = model.schema.diff(self.orig, opts);
              self.orig = t.object.clone(self.opts);
              self.cache().then(function() {
                t.team.current.queue.process({type: model.type + '.offline.update', opts: diff, id: self.id});
                fulfill(self);
              });
            } else {
              self.opts = t.object.clone(self.orig);
              reject(xhr);
            }
          });
        });
      },
      refresh: function() {
        var self = this;
        return new Promise(function (fulfill, reject) {
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
        var self = this;
        return new Promise(function (fulfill, reject) {
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
          t.team.cache(model.type + '-' + self.id, self.encrypted()).then(function(){
            fulfill(self);
          });
        });
      },
      uncache: function() {
        var self = this;
        return model.uncache(self.id);
      },
      remove: function() {
        var self = this;
        return new Promise(function(fulfill, reject) {
          var data = {
            team_id: t.team.current.id,
            mkey:    t.team.current.mkey,
            id:      self.id
          };
          if(self.comments) {
            data['comment_ids'] = self.comments().reduce(function(a, b) {
              return a.concat([b.id]);
            }, []);
          };
          t.xhr.post('/team/'+model.type+'/remove', {
            data: data
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
        var self = this;
        var data = {
          id:   self.id,
          opts: self.opts,
          iv:   self.iv
        };
        if(model.track_history) {
          data.hist = self.hist;
        }
        var config = {};
        if(iv) {
          data.iv = iv;
          config.iv = iv;
        }
        return t.team.encrypt(data, config);
      },
      active: function() {
        var self = this;
        return model.current && model.current.id == self.id ? 'active' : '';
      },
      history: function() {
        var self = this;
        var h = [];
        self.hist.forEach(function(data, i) {
          var d = t.model.history.create(data, self);
          if(i == 0) {
            d.first = true;
          }
          h.push(d);
        });
        // Alias pass moved from model init
        // t.array.moveProperty(self.hist, a.oldProp, a.newProp, 'diff');
        return h;
      },
      alias: function() {
        var self = this;
        model.aliasProps.forEach(function(a) {
          if(a.oldProp in self.opts) {
            self.opts[a.newProp] = self.opts[a.oldProp];
            delete self.opts[a.oldProp];
          }
        });
      }
    };
  };

  return _prototype;

})(Teambo);
