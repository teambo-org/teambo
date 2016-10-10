Teambo.team = (function(t){
    "use strict";
    
    var team = function(data, mkey, key) {
        var self = this;
        if(typeof data == 'string') {
            data = t.crypto.decrypt(data, key);
        }
        t.extend(this, {
            id:         data.id,
            mkey:       mkey,
            opts:       data.opts       ? data.opts       : {},
            hist:       data.hist       ? data.hist       : [],
            bucket_ids: data.bucket_ids ? data.bucket_ids : [],
            buckets: {},
            save: function() {
                if(!mkey) {
                    return Promise.reject('No mkey');
                }
                return t.promise(function(fulfill, reject) {
                    t.xhr.post('/team', {
                        data: {
                            id:   self.id,
                            mkey: mkey,
                            ct:   self.encrypted()
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
            },
            update: function(opts) {
                self.opts = t.extend(self.opts, opts);
                return t.promise(function(fulfill, reject) {
                    self.save().then(function(xhr) {
                        fulfill(self)
                    }).catch(function(e) {
                        reject(e);
                    });
                });
            },
            cache: function() {
                var hash = t.crypto.sha(self.id+t.salt);
                localforage.setItem(hash, self.encrypted());
            },
            encrypted: function() {
                return self.encrypt({
                    id:   self.id,
                    opts: self.opts,
                    hist: self.hist,
                    bucket_ids: self.bucket_ids
                });
            },
            encrypt: function(data) {
                return t.crypto.encrypt(data, key);
            },
            decrypt: function(ct) {
                return t.crypto.decrypt(ct, key);
            },
            bucket_list: function() {
                var ret = [];
                for(var k in self.buckets) {
                    ret.push(self.buckets[k]);
                }
                return ret;
            },
            theme: function() {
                if(typeof(self.opts.theme) === "object") {
                    return self.opts.theme;
                } else if(typeof(self.opts.theme) === "string" && self.opts.theme in t.themes) {
                    return t.themes[self.opts.theme];
                } else {
                    return t.themes['dark'];
                }
            }
        });
    };
    
    team.current = null;
    
    team.init = function(id) {
        return t.promise(function(fulfill, reject){
            t.acct.current.team.find(id).then(function(o){
                team.current = o;
                var p = [];
                o.bucket_ids.forEach(function(bucket_id){
                    p.push(team.bucket.find(bucket_id).then(function(bucket){
                        team.current.buckets[bucket.id] = bucket;
                    }));
                });
                Promise.all(p).then(function() {
                    var p = [];
                    team.current.bucket_ids.forEach(function(bucket_id){
                        t.team.current.buckets[bucket_id].item_ids.forEach(function(item_id){
                            p.push(team.item.find(bucket_id, item_id).then(function(item){
                                team.current.buckets[bucket_id].items[item.id] = item;
                            }));
                        });
                    });
                    Promise.all(p).then(function() {
                        fulfill(o);
                    }).catch(function(e){
                        reject(e);
                    });
                }).catch(function(e){
                    reject(e);
                });
            });
        });
    };
    
    team.create = function(name) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team').then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText),
                        key = t.crypto.randomKey(),
                        acct = t.acct.current;
                    var new_team = new team({
                        id:   data.team.id,
                        opts: {
                            name: name
                        }
                    }, data.mkey, key);
                    new_team.save().then(function(){
                        acct.team.add(new_team.id, data.mkey, key);
                        acct.save().then(function(){
                            fulfill(new_team);
                        }).catch(function(e){
                            reject(e);
                        });
                    }).catch(function(e){
                        acct.team.remove(new_team.id);
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
    
    // t.event.register('bucket-create', {
        // apply: function(events, obj) {
            // if(events.length > 0) {
                // return Promise.reject();
            // }
            // team.buckets.find(obj.id).then(function(bucket){
                // if(!bucket) {
                    // var b = new t.bucket(obj);
                    // b.cache();
                    // team.buckets.add({id: obj.id});
                    // return Promise.resolve();
                // }
            // });
        // }
    // });
    
    return team;

})(Teambo);
