Teambo.team.bucket = (function(t){
    "use strict";
    
    var bucket = function(data) {
        var self = this;
        t.extend(this, {
            id:   data.id,
            opts: data.opts ? data.opts : {}
        });
        this.save = function() {
            return t.promise(function(fulfill, reject) {
                t.xhr.post('/team/bucket', {
                    data: {
                        team_id: t.team.current.id,
                        mkey:    t.team.current.mkey,
                        id:      self.id,
                        ct:      self.encrypted()
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
            return t.team.bucket.encrypt({
                id:   self.id,
                opts: self.opts
            });
        }
    };
    
    bucket.create = function(name) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team/bucket', {
                data: {
                    acct_id: t.acct.id,
                    team_id: t.team.current.id,
                    mkey:    t.team.current.mkey
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    var bucket = new t.team.bucket({
                        id:   data.id,
                        opts: { name: name }
                    });
                    bucket.save().then(function(xhr){
                        t.team.current.bucket_ids.push(bucket.id);
                        t.team.current.buckets[bucket.id] = bucket;
                        t.id('right').innerHTML = t.view.render('dashboard/right');
                        t.team.current.save().then(function(xhr){
                            fulfill(bucket);
                        }).catch(function(e){
                            reject(e);
                        });
                    }).catch(function(e){
                        reject(e);
                    });
                } else {
                    reject(xhr);
                }
            }).catch(function(e){
                reject(e);
            });
        });
    };
    
    bucket.remove = function(bucket_id) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team/bucket/remove', {
                data: {
                    team_id: t.team.current.id,
                    mkey:    t.team.current.mkey,
                    bucket_id: bucket_id
                }
            }).then(function(xhr){
                if(xhr.status == 204) {
                    delete(t.team.current.buckets[bucket_id]);
                    t.team.current.bucket_ids.splice(bucket_id, 1);
                    t.team.current.save().then(function(xhr){
                        fulfill();
                    }).catch(function(e){
                        reject(e);
                    });
                } else {
                    reject(xhr);
                }
            }).catch(function(e){
                reject(e);
            });
        });
    };
    
    bucket.find = function(id) {
        return t.promise(function(fulfill, reject){
            var team = t.team.current;
            if(team.bucket_ids.indexOf(id) < 0) {
                reject();
                return;
            }
            localforage.getItem(t.crypto.sha(team.id+id+t.salt)).then(function(ct){
                if(ct) {
                    fulfill(new t.team.bucket(t.team.bucket.decrypt(ct)));
                } else {
                    bucket.fetch(id, team.id, team.mkey).then(function(ct) {
                        fulfill(new t.team.bucket(t.team.bucket.decrypt(ct)));
                    }).catch(function(e) {
                        reject(e);
                    });
                }
            });
        });
    };
    bucket.fetch = function(id, team_id, mkey) {
        return t.promise(function(fulfill, reject) {
            t.xhr.get('/team/bucket', {
                data: {
                    id: id,
                    team_id: team_id,
                    mkey: mkey
                }
            }).then(function(xhr) {
                if (xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    fulfill(data.ct);
                } else {
                    reject("Failed to retrieve team " + id);
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
    bucket.all = function() {
        return t.promise(function(fulfill, reject) {
            var ret = [],
                p = [],
                team = t.team.current;
            team.bucket_ids.forEach(function(bucket_id) {
                var hash = t.crypto.sha(team.id+bucket_id+t.salt);
                p.push(localforage.getItem(hash).then(function(ct){
                    if(ct) {
                        ret.push(new t.team.bucket(t.team.bucket.decrypt(ct)));
                    }
                }));
            });
            Promise.all(p).then(function() {
                fulfill(ret);
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

})(Teambo);
