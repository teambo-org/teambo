(function(){
    "use strict";
    
    var salt = null;
    
    t.team = function(data) {
        var self = this,
            key = data.key;
        t.extend(this, {
            id:   data.id,
            akey: data.akey,
            name: data.name,
            opts: data.opts ? data.opts : {}
        });
        this.save = function() {
            return t.promise(function(fulfill, reject) {
                t.xhr.post('/team', {
                    data: {
                        id:   self.id,
                        akey: self.akey,
                        ct:   self.encrypt()
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
            var hash = t.crypto.sha(self.id+salt);
            localforage.setItem(hash, self.encrypt());
        };
        this.encrypt = function() {
            return t.encrypt({
                id:    self.id,
                akey:  self.akey,
                name:  self.name,
                opts:  self.opts,
                key:   key
            }, key);
        };
    };
    
    t.team.init = function() {
        return t.salt().then(function(s){
            salt = s;
        });
    };
    
    t.team.create = function(name) {
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/team').then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText),
                        key = t.crypto.randomKey();
                    var team = new t.team({
                        id:   data.id,
                        akey: data.akey,
                        name: name,
                        key:  key
                    });
                    team.save().then(function(xhr){
                        t.acct.team.add(data.id, key);
                        t.acct.save().then(function(xhr){
                            fulfill(team);
                        }).catch(function(e){
                            reject(e);
                        });
                    }).catch(function(e){
                        t.acct.team.remove(team);
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

})();