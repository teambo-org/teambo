Teambo.item = (function(t){
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
        if(typeof data == 'string') {
            var iv = data.split(' ')[0];
            data = item.decrypt(data);
            data.iv = data.iv ? data.iv : iv;
        }
        t.extend(this, {
            id:        data.id,
            opts:      data.opts ? data.opts : {},
            hist:      data.hist ? data.hist : []
        });
        this.save = function() {
            return t.promise(function(fulfill, reject) {
                if(!self.id) {
                    reject('must supply item id to save');
                }
                t.xhr.post('/item', {
                    data: {
                        team_id:   t.team.current.id,
                        mkey:      t.team.current.mkey,
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
            var hash = t.crypto.sha(t.team.current.id+self.id+t.salt);
            return localforage.setItem(hash, self.encrypted());
        };
        this.uncache = function() {
            var hash = t.crypto.sha(t.team.current.id+self.id+t.salt);
            return localforage.removeItem(hash);
        };
        this.encrypted = function() {
            return t.item.encrypt({
                id:        self.id,
                opts:      self.opts
            });
        };
        this.status = function() {
            return statuses[self.opts.status];
        };
    };

    item.all = [];
    
    item.cacheIds = function() {
        var hash = t.crypto.sha(t.team.current.id+"items"+t.salt);
        var ids = [];
        for(var i in item.all) {
            ids.push(item.all[i].id);
        }
        return localforage.setItem(hash, item.encrypt(ids));
    };
    
    item.statuses = statuses;

    item.create = function(opts) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/item', {
                data: {
                    team_id:   t.team.current.id,
                    mkey:      t.team.current.mkey
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    var new_item = new t.item({
                        id:        data.id,
                        opts:      opts
                    });
                    new_item.save().then(function(xhr){
                        item.all.push(new_item);
                        item.cacheIds();
                        fulfill(new_item);
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

    item.update = function(item_id, opts) {
        return t.promise(function(fulfill, reject) {
            item.fetch(item_id, t.team.current.id, t.team.current.mkey).then(function(ct){
                var new_item = new item(item.decrypt(ct));
                new_item.opts = t.extend(new_item.opts, opts);
                new_item.save().then(function(xhr){
                    for(var i in item.all) {
                        if(item.all[i].id == item_id) {
                            item.all[i] = new_item;
                        }
                    }
                    new_item.cache().then(function(){
                        fulfill(new_item);
                    });
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

    item.remove = function(item_id) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/item/remove', {
                data: {
                    team_id:   t.team.current.id,
                    mkey:      t.team.current.mkey,
                    item_id:   item_id
                }
            }).then(function(xhr){
                if(xhr.status == 204) {
                    var hash = t.crypto.sha(t.team.current.id+item_id+t.salt);
                    localforage.removeItem(hash).then(function(){
                        item.all = t.deleteByProperty(item.all, 'id', item_id);
                        item.cacheIds().then(function(){
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
    };
    
    item.get = function(id) {
        for(var i in item.all) {
            var b = item.all[i];
            if(b.id == id) {
                return b;
            }
        }
    };
    
    item.getByBucket = function(bucket_id) {
        var items = [];
        for(var i in item.all) {
            var b = item.all[i];
            if(b.opts.bucket_id == bucket_id) {
                items.push(b);
            }
        }
        return items;
    };

    item.find = function(id) {
        return t.promise(function(fulfill, reject){
            var team = t.team.current;
            localforage.getItem(t.crypto.sha(team.id+id+t.salt)).then(function(ct){
                if(ct) {
                    fulfill(new t.item(t.item.decrypt(ct)));
                } else {
                    item.fetch(id, team.id, team.mkey).then(function(ct) {
                        fulfill(new t.item(t.item.decrypt(ct)));
                    }).catch(function(e) {
                        reject(e);
                    });
                }
            });
        });
    };
    item.fetch = function(id, team_id, mkey) {
        return t.promise(function(fulfill, reject) {
            t.xhr.get('/item', {
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
    
    item.findAll = function() {
        return t.promise(function(fulfill, reject) {
            var ret = [],
                p = [],
                team = t.team.current;
            var hash = t.crypto.sha(team.id+"items"+t.salt);
            localforage.getItem(hash).then(function(ct){
                if(ct) {
                    var ids = item.decrypt(ct);
                    var p = [];
                    for(var i in ids) {
                        p.push(item.find(ids[i]).then(function(b){
                            ret.push(b);
                        }));
                    }
                    Promise.all(p).then(function() {
                        item.all = ret;
                        fulfill(ret);
                    }).catch(function(e){
                        reject(e);
                    });
                } else {
                    item.fetchAll(team.id, team.mkey).then(function(data){
                        var items = [];
                        for(var i in data) {
                            items.push(new item(item.decrypt(data[i].ct)));
                        }
                        item.all = items;
                        item.cacheIds();
                        fulfill(items);
                    }).catch(function(e){
                        reject(e);
                    });
                }
            });
        });
    };
    item.fetchAll = function(team_id, mkey) {
        return t.promise(function(fulfill, reject) {
            t.xhr.get('/item/all', {
                data: {
                    team_id: team_id,
                    mkey: mkey
                }
            }).then(function(xhr) {
                if (xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    fulfill(data || []);    
                } else {
                    reject("Failed to retrieve all items");
                }
            });

        });
    };
    
    item.findByBucket = function(bucket_id) {
        return t.promise(function(fulfill, reject) {
            item.findAll().then(function(items){
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

    return item;

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
