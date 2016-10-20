Teambo.bucket = (function(t){
  "use strict";

  var bucket = function(data) {
    var self = this;
    if(typeof data == 'string') {
      var iv = data.split(' ')[0];
      data = bucket.decrypt(data);
      data.iv = data.iv ? data.iv : iv;
    }
    t.extend(this, {
      id: data.id,
      opts: data.opts ? data.opts : {}
    });
    this.save = function() {
      return t.promise(function(fulfill, reject) {
        if(!self.id) {
          reject('must supply bucket id to save');
          return;
        }
        t.xhr.post('/bucket', {
          data: {
            team_id: t.team.current.id,
            mkey: t.team.current.mkey,
            bucket_id: self.id,
            ct: self.encrypted()
          }
        }).then(function(xhr){
          if(xhr.status == 200) {
            self.cache();
            fulfill(xhr);
          } else {
            reject(xhr);
          }
        }).catch(function(e){
          reject(e);
        });
      });
    };
    this.cache = function() {
      var hash = t.crypto.sha(t.team.current.id+self.id+t.salt);
      localforage.setItem(hash, self.encrypted());
    };
    this.encrypted = function() {
      return bucket.encrypt({
        id: self.id,
        opts: self.opts
      });
    };
    this.item_list = function() {
      return t.item.getByBucket(self.id);
    };
    this.item_list_incomplete = function() {
      return self.item_list().filter(function(o) {
        return o.opts.status !== 'complete';
      });
    };
    this.item_list_complete = function() {
      return self.item_list().filter(function(o) {
        return o.opts.status === 'complete';
      });
    };
    this.item_count = function() {
      return self.item_list().length;
    };
  };

  bucket.all = [];
  bucket.cacheIds = function() {
    var hash = t.crypto.sha(t.team.current.id+"buckets"+t.salt);
    var ids = [];
    for(var i in bucket.all) {
      ids.push(bucket.all[i].id);
    }
    return localforage.setItem(hash, bucket.encrypt(ids));
  };
  bucket.create = function(opts, id) {
    return t.promise(function(fulfill, reject) {
      var data = {
        team_id: t.team.current.id,
        mkey:  t.team.current.mkey
      };
      if(id) {
        data.bucket_id = id
      }
      t.xhr.post('/buckets', {
        data: data
      }).then(function(xhr){
        if(xhr.status == 200) {
          var data = JSON.parse(xhr.responseText);
          var new_bucket = new t.bucket({
            id:   data.id,
            opts: opts
          });
          new_bucket.save().then(function(xhr){
            bucket.all.push(new_bucket);
            bucket.cacheIds();
            fulfill(new_bucket);
          }).catch(function(e){
            reject(e);
          });
        } else {
          reject(xhr);
        }
      }).catch(function(e){
        // Add create bucket event
        // Apply create bucket event
        reject(e);
      });
    });
  };
  bucket.update = function(bucket_id, opts) {
    return t.promise(function(fulfill, reject) {
      bucket.fetch(bucket_id, t.team.current.id, t.team.current.mkey).then(function(ct){
        var b = new t.bucket(t.bucket.decrypt(ct));
        b.opts = t.extend(b.opts, opts);
        b.save().then(function(xhr){
          for(var i in bucket.all) {
            if(bucket.all[i].id == bucket_id) {
              bucket.all[i] = b;
            }
          }
          fulfill(b);
        }).catch(function(e){
          reject(e);
        });
      }).catch(function(e){
        // Save bucket update event
        // Apply bucket update event
        reject(e);
      });
    });
  };
  bucket.remove = function(bucket_id) {
    return t.promise(function(fulfill, reject) {
      t.xhr.post('/bucket/remove', {
        data: {
          team_id: t.team.current.id,
          mkey:  t.team.current.mkey,
          bucket_id: bucket_id
        }
      }).then(function(xhr){
        if(xhr.status == 204) {
          var hash = t.crypto.sha(t.team.current.id+bucket_id+t.salt);
          localforage.removeItem(hash).then(function(){
            bucket.all = t.deleteByProperty(bucket.all, 'id', bucket_id);
            bucket.cacheIds().then(function(){
              fulfill();
            });
          });
        } else {
          reject(xhr);
        }
      }).catch(function(e){
        // Save bucket delete event
        // Apply bucket delete event
        reject(e);
      });
    });
  };
  bucket.get = function(id) {
    for(var i in bucket.all) {
      var b = bucket.all[i];
      if(b.id == id) {
        return b;
      }
    }
  };
  bucket.find = function(id) {
    return t.promise(function(fulfill, reject){
      var team = t.team.current;
      localforage.getItem(t.crypto.sha(team.id+id+t.salt)).then(function(ct){
        if(ct) {
          fulfill(new bucket(bucket.decrypt(ct)));
        } else {
          bucket.fetch(id, team.id, team.mkey).then(function(ct) {
            fulfill(new bucket(bucket.decrypt(ct)));
          }).catch(function(e) {
            reject(e);
          });
        }
      });
    });
  };
  bucket.fetch = function(id, team_id, mkey) {
    return t.promise(function(fulfill, reject) {
      t.xhr.get('/bucket', {
        data: {
          bucket_id: id,
          team_id: team_id,
          mkey: mkey
        }
      }).then(function(xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          fulfill(data.ct);
        } else {
          reject("Failed to retrieve bucket " + id);
        }
      });

    });
  };
  bucket.encrypt = function(data) {
    return t.team.current.encrypt(data);
  };
  bucket.decrypt = function(ct) {
    return t.team.current.decrypt(ct);
  };
  bucket.findAll = function() {
    return t.promise(function(fulfill, reject) {
      var ret = [],
        p = [],
        team = t.team.current;
      var hash = t.crypto.sha(team.id+"buckets"+t.salt);
      localforage.getItem(hash).then(function(ct){
        if(ct) {
          var ids = bucket.decrypt(ct);
          var p = [];
          for(var i in ids) {
            if(!ids[i]) {
              continue;
            }
            p.push(bucket.find(ids[i]).then(function(b){
              ret.push(b);
            }));
          }
          Promise.all(p).then(function() {
            bucket.all = ret;
            fulfill(ret);
          }).catch(function(e){
            reject(e);
          });
        } else {
          bucket.fetchAll(team.id, team.mkey).then(function(data){
            var buckets = [];
            for(var i in data) {
              buckets.push(new bucket(data[i].ct));
            }
            bucket.all = buckets;
            bucket.cacheIds();
            fulfill(buckets);
          }).catch(function(e){
            reject(e);
          });
        }
      });
    });
  };
  bucket.fetchAll = function(team_id, mkey) {
    return t.promise(function(fulfill, reject) {
      t.xhr.get('/buckets', {
        data: {
          team_id: team_id,
          mkey: mkey
        }
      }).then(function(xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          fulfill(data || []);
        } else {
          reject("Failed to retrieve all buckets");
        }
      });
    });
  };

  return bucket;

  // t.event.register('bucket-create', {
    // apply: function(events, obj) {
      // if(events.length > 0) {
        // return Promise.reject();
      // }
      // t.team.buckets.find(obj.id).then(function(bucket){
        // if(!bucket) {
          // var b = new t.bucket(obj);
          // b.cache();
          // t.team.buckets.add({id: obj.id});
          // return Promise.resolve();
        // }
      // });
    // }
  // });

  // Create event
  // Apply event
  // Persist event

})(Teambo);
