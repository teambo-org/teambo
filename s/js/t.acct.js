(function(){
    "use strict";
    
    var authed = null,
        salt = null;
    
    t.acct = function(data) {
        t.extend(this, data);
    };
    
    t.acct.email = function() {
        return authed ? authed.email : null;
    };
    t.acct.teams = function() {
        return authed ? authed.teams : null;
    };
    
    t.acct.init = function() {
        var p = [];
        p.push(t.acct.wake());
        p.push(t.team.init());
        p.push(t.salt().then(function(s){
            salt = s;
        }));
        if(t.debug()) {
            t.acct.debug = function() {
                return authed;
            };
        }
        return Promise.all(p);
    };
    
    t.acct.cache = function() {
        var hash = t.crypto.sha(authed.email+salt);
        sessionStorage.setItem('auth', JSON.stringify({hash: hash, key: authed.key}));
        localforage.setItem(hash, t.acct.encrypt());
    };
    
    t.acct.wake = function() {
        var auth = sessionStorage.getItem('auth');
        if(auth) {
            auth = JSON.parse(auth);
            return t.promise(function(fulfill, reject){
                localforage.getItem(auth.hash).then(function(acct){
                    var data = t.decrypt(acct, auth.key);
                    if(data) {
                        authed = new t.acct();
                        fulfill();
                    } else {
                        reject();
                    }
                });
            });
        } else {
            return Promise.resolve();
        }
    }
    
    t.acct.isAuthed = function() {
        return authed !== null;
    };
    
    t.acct.deAuth = function() {
        authed = null;
        sessionStorage.removeItem('auth');
    };
    
    t.acct.save = function() {
        if(!authed) {
            return Promise.reject('Not authed');
        }
        return t.promise(function(fulfill, reject) {
            t.xhr.post('/acct', {
                data: {
                    id:   authed.id,
                    akey: authed.akey,
                    ct:   t.acct.encrypt()
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    t.acct.cache();
                    fulfill(xhr);
                } else {
                    reject(xhr);
                }
            }).catch(function(e){
                reject(e);
            });
        });
    };
    
    t.acct.encrypt = function() {
        if(!authed) {
            return;
        }
        return t.encrypt({
            email: authed.email,
            id:    authed.id,
            key:   authed.key,
            akey:  authed.akey,
            name:  authed.name,
            teams: authed.teams,
            opts:  authed.opts
        }, authed.key);
    };
    
    t.acct.auth = function(email, pass) {
        var id   = t.crypto.sha(email),
            key  = t.crypto.pbk(pass, email),
            akey = t.crypto.pbk(pass, id + key);
        return t.promise(function(fulfill, reject){
            t.xhr.post('/acct/auth', {
                data: {
                    id:   id,
                    akey: akey
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    if(!data || !data.ct) {
                        reject(xhr);
                    }
                    authed = new t.acct(t.decrypt(data.ct, key));
                    t.acct.cache();
                }
                fulfill(xhr);
            }).catch(function(e){
                reject(e);
            });
        });
    };
    
    t.acct.verification = {
        send : function(email, pass) {
            if(!email || !pass) {
                return Promise.reject();
            }
            var id   = t.crypto.sha(email),
                key  = t.crypto.pbk(pass, email),
                akey = t.crypto.pbk(pass, id + key);
            return t.promise(function(fulfill, reject) {
                t.xhr.post('/acct/verification', {
                    data: {
                        email: email,
                        akey:  akey,
                    }
                }).then(function(xhr){
                    if(xhr.status == 201) {
                        localforage.setItem('verification', {
                            email: email,
                            id:   id,
                            key:  key,
                            akey: akey
                        });
                        fulfill(xhr);
                    }
                }).catch(function(e){
                    reject(e);
                });
            });
        },
        confirm : function(vkey, email, pass) {
            var id, key, akey;
            return t.promise(function(fulfill, reject) {
                var send_confirmation = function() {
                    t.xhr.post('/acct/verification', {
                        data: {
                            id:   id,
                            akey: akey,
                            vkey: vkey
                        }
                    }).then(function(xhr){
                        if(xhr.status == 200) {
                            var data = JSON.parse(xhr.responseText);
                            localforage.removeItem('verification');
                            authed = new t.acct({
                                email: email,
                                id:    id,
                                key:   key,
                                akey:  akey,
                                teams: [],
                                opts:  {}
                            });
                            t.acct.save().then(function(xhr){
                                fulfill(xhr);
                            }).catch(function(e){
                                reject(e);
                            });
                        } else {
                            reject(xhr);
                        }
                    }).catch(function(e){
                        reject(e);
                    });
                }
                if(!email || !pass) {
                    localforage.getItem('verification').then(function(v){
                        if(v) {
                            email = v.email;
                            id    = v.id;
                            key   = v.key;
                            akey  = v.akey;
                            send_confirmation();
                        } else {
                            reject("Verification not found");
                        }
                    });
                } else {
                    id   = t.crypto.sha(email);
                    key  = t.crypto.pbk(pass, email);
                    akey = t.crypto.pbk(pass, id + key);
                    send_confirmation();
                }
            });
        }
    };
    
    t.acct.team = {
        add: function(id, key) {
            return authed && id && authed.teams.push({id: id, key: key});
        },
        remove: function(id) {
            return authed && id && authed.teams.deleteByProperty('id', id);
        },
        all: function() {
            return t.promise(function(fulfill, reject) {
                var ret = [],
                    p = [];
                authed.teams.forEach(function(v) {
                    var hash = t.crypto.sha(v.id+salt);
                    p.push(localforage.getItem(hash).then(function(ct){
                        if(ct) {
                            ret.push(new t.team(t.decrypt(ct, v.key)));
                        }
                    }));
                });
                Promise.all(p).then(function() {
                    fulfill(ret);
                });
            });
        },
        reset: function() {
            if(!t.debug()) {
                return;
            }
            authed.teams = [];
            t.acct.save();
        },
        find: function(id) {
            return t.promise(function(fulfill, reject){
                var d = authed.teams.findByProperty('id', id);
                if(!d) {
                    reject();
                    return;
                }
                localforage.getItem(t.crypto.sha(id+salt)).then(function(ct){
                    fulfill(new t.team(t.decrypt(ct, d.key)));
                });
            });
        }
    };

})();