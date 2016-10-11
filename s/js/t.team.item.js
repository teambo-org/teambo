Teambo.team.item = (function(t){
    "use strict";

    var statuses = {
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

    var item = function(data) {
        var self = this;
        t.extend(this, {
            id:        data.id,
            bucket_id: data.bucket_id,
            opts:      data.opts ? data.opts : {},
            hist:      data.hist ? data.hist : []
        });
        this.save = function() {
            return t.promise(function(fulfill, reject) {
                if(!self.id) {
                    reject('must supply item id to save');
                }
                t.xhr.post('/team/item', {
                    data: {
                        team_id:   t.team.current.id,
                        mkey:      t.team.current.mkey,
                        bucket_id: self.bucket_id,
                        id:        self.id,
                        ct:        self.encrypted()
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
            var hash = t.crypto.sha(t.team.current.id+self.bucket_id+self.id+t.salt);
            localforage.setItem(hash, self.encrypted());
        };
        this.uncache = function() {
            var hash = t.crypto.sha(t.team.current.id+self.bucket_id+self.id+t.salt);
            localforage.removeItem(hash);
        };
        this.encrypted = function() {
            return t.team.item.encrypt({
                id:        self.id,
                bucket_id: self.bucket_id,
                opts:      self.opts
            });
        };
        this.status = function() {
            return statuses[self.opts.status];
        };
    };

    item.statuses = statuses;

    item.create = function(bucket_id, opts) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team/item', {
                data: {
                    acct_id:   t.acct.id,
                    team_id:   t.team.current.id,
                    bucket_id: bucket_id,
                    mkey:      t.team.current.mkey
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    var item = new t.team.item({
                        id:        data.id,
                        bucket_id: bucket_id,
                        opts:      opts
                    });
                    item.save(bucket_id).then(function(xhr){
                        t.team.current.buckets[bucket_id].item_ids.push(item.id);
                        t.team.current.buckets[bucket_id].items[item.id] = item;
                        t.team.current.buckets[bucket_id].save().then(function(xhr){
                            fulfill(item);
                        }).catch(function(e){
                            reject(e);
                        });
                    }).catch(function(e){
                        reject(e);
                    });
                } else if(xhr.status == 0) {
                    var temp_id = t.crypto.randomKey();
                    // Create Event
                    var event = {
                        type: 'item.create',
                        data: {
                            acct_id:   t.acct.id,
                            team_id:   t.team.current.id,
                            bucket_id: bucket_id,
                            mkey:      t.team.current.mkey
                        },
                        temp_id: temp_id
                    };
                    var event2 = {
                        type: 'item.save',
                        data: {
                            id:        temp_id,
                            bucket_id: bucket_id,
                            opts:      opts
                        }
                    };
                    t.team.current.queue([event, event2]);
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

    item.update = function(bucket_id, item_id, opts) {
        return t.promise(function(fulfill, reject) {
            t.xhr.get('/team/item', {
                data: {
                    acct_id:   t.acct.id,
                    team_id:   t.team.current.id,
                    bucket_id: bucket_id,
                    id:        item_id,
                    mkey:      t.team.current.mkey
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    var item = new t.team.item({
                        id:        data.id,
                        bucket_id: bucket_id,
                        opts:      opts
                    });
                    item.save(bucket_id).then(function(xhr){
                        t.team.current.buckets[bucket_id].items[item.id] = item;
                        fulfill(item);
                    }).catch(function(e){
                        reject(e);
                    });
                }
            }).catch(function(e){
                // Save item update event
                // Apply item update event
                reject(e);
            });
        });
    };

    item.remove = function(bucket_id, item_id) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team/item/remove', {
                data: {
                    team_id:   t.team.current.id,
                    mkey:      t.team.current.mkey,
                    bucket_id: bucket_id,
                    item_id:   item_id
                }
            }).then(function(xhr){
                if(xhr.status == 204) {
                    var item_ids = t.team.current.buckets[bucket_id].item_ids;
                    t.array.remove(t.team.current.buckets[bucket_id].item_ids, item_id);
                    t.team.current.buckets[bucket_id].save().then(function(xhr){
                        t.team.current.buckets[bucket_id].items[item_id].uncache();
                        delete(t.team.current.buckets[bucket_id].items[item_id]);
                        fulfill();
                    }).catch(function(e){
                        t.team.current.buckets[bucket_id].item_ids = item_ids;
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

    item.find = function(bucket_id, id) {
        return t.promise(function(fulfill, reject){
            var team = t.team.current;
            var bucket = team.buckets[bucket_id];
            if(bucket.item_ids.indexOf(id) < 0) {
                reject();
                return;
            }
            localforage.getItem(t.crypto.sha(team.id+bucket.id+id+t.salt)).then(function(ct){
                if(ct) {
                    fulfill(new t.team.item(t.team.item.decrypt(ct)));
                } else {
                    item.fetch(id, bucket.id, team.id, team.mkey).then(function(ct) {
                        fulfill(new t.team.item(t.team.item.decrypt(ct)));
                    }).catch(function(e) {
                        reject(e);
                    });
                }
            });
        });
    };
    item.fetch = function(id, bucket_id, team_id, mkey) {
        return t.promise(function(fulfill, reject) {
            t.xhr.get('/team/item', {
                data: {
                    id: id,
                    team_id: team_id,
                    bucket_id: bucket_id,
                    mkey: mkey
                }
            }).then(function(xhr) {
                if (xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    fulfill(data.ct);
                } else {
                    reject("Failed to retrieve item " + id);
                }
            });

        });
    };
    item.encrypt = function(data) {
        return t.team.current.encrypt(data);
    };
    item.decrypt = function(ct) {
        return t.team.current.decrypt(ct);
    };
    item.all = function(bucket_id) {
        return t.promise(function(fulfill, reject) {
            var ret = [],
                p = [],
                team = t.team.current,
                bucket = team.buckets[bucket_id];
            bucket.item_ids.forEach(function(item_id) {
                var hash = t.crypto.sha(team.id+bucket_id+item_id+t.salt);
                p.push(localforage.getItem(hash).then(function(ct){
                    if(ct) {
                        ret.push(new t.team.item(t.team.item.decrypt(ct)));
                    }
                }));
            });
            Promise.all(p).then(function() {
                fulfill(ret);
            });
        });
    };

    return item;

    // t.event.register('item-create', {
        // apply: function(events, obj) {
            // if(events.length > 0) {
                // return Promise.reject();
            // }
            // t.team.items.find(obj.id).then(function(item){
                // if(!item) {
                    // var b = new t.item(obj);
                    // b.cache();
                    // t.team.items.add({id: obj.id});
                    // return Promise.resolve();
                // }
            // });
        // }
    // });

    // Create event
    // Apply event
    // Persist event

})(Teambo);
