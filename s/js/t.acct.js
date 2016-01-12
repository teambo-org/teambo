(function(){
    "use strict";
    
    var authed = null;
    
    t.acct = function(data) {
        t.extend(this, data);
    };
    
    t.acct.email = function() {
        return authed ? authed.email : null;
    };
    
    t.acct.init = function() {
        if(t.debug()) {
            t.acct.debug = function() {
                return authed;
            };
        }
        var auth = sessionStorage.getItem('auth');
        if(auth) {
            auth = JSON.parse(auth);
            return localforage.getItem('acct-'+auth.hash).then(function(acct){
                authed = new t.acct(t.decrypt(acct, auth.pbk));
            });
        } else {
            return Promise.resolve();
        }
    };
    
    t.acct.cache = function() {
        localforage.getItem('salt').then(function(salt){
            if(!salt) {
                salt = t.crypto.randomKey();
                localforage.setItem('salt', salt);
            }
            var hash = t.crypto.sha(authed.email+salt);
            sessionStorage.setItem('auth', JSON.stringify({hash: hash, pbk: authed.pbk}));
            localforage.setItem('acct-'+hash, t.acct.encrypt());
        });
    };
    
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
                    hash: authed.hash,
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
            hash:  authed.hash,
            akey:  authed.akey,
            pbk:   authed.pbk,
            name:  authed.name,
            teams: authed.teams,
            opts:  authed.opts
        }, authed.pbk);
    };
    
    t.acct.auth = function(email, pass) {
        var hash = t.crypto.sha(email),
            akey = t.crypto.akey(pass, email);
        return t.promise(function(fulfill, reject){
            t.xhr.post('/acct/auth', {
                data: {
                    hash: hash,
                    akey: akey
                }
            }).then(function(xhr){
                if(xhr.status == 200) {
                    var data = JSON.parse(xhr.responseText);
                    var pbk  = t.crypto.pbk(pass, email);
                    if(!data || !data.ct) {
                        reject(xhr);
                    }
                    authed = new t.acct(t.decrypt(data.ct, pbk));
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
            var pbk   = t.crypto.pbk(pass, email),
                akey  = t.crypto.akey(pass, email);
            return t.promise(function(fulfill, reject) {
                t.xhr.post('/acct/verification', {
                    data: {
                        email: email,
                        akey:  akey
                    }
                }).then(function(xhr){
                    if(xhr.status == 201) {
                        localforage.setItem('verification', {
                            email: email,
                            akey:  akey,
                            pbk:   pbk
                        });
                        fulfill(xhr);
                    }
                }).catch(function(e){
                    reject(e);
                });
            });
        },
        confirm : function(vkey, email, pass) {
            var pbk, akey;
            return t.promise(function(fulfill, reject) {
                var send_confirmation = function() {
                    var hash = t.crypto.sha(email);
                    t.xhr.post('/acct/verification', {
                        data: {
                            hash: hash,
                            akey: akey,
                            vkey: vkey
                        }
                    }).then(function(xhr){
                        if(xhr.status == 200) {
                            var data = JSON.parse(xhr.responseText);
                            localforage.removeItem('verification');
                            authed = new t.acct({
                                email: email,
                                hash:  hash,
                                akey:  akey,
                                pbk:   pbk,
                                teams: {},
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
                            akey = v.akey;
                            pbk  = v.pbk;
                            send_confirmation();
                        } else {
                            reject("Verification not found");
                        }
                    });
                } else {
                    akey = t.crypto.akey(pass, email);
                    pbk  = t.crypto.pbk(pass, email);
                    send_confirmation();
                }
            });
        }
    };
    
    t.acct.team = {
        add: function(team) {
            return authed && team.hash && (authed.teams[team.hash.substr(0,8)] = team);
        },
        remove: function(team) {
            return authed && team.hash && (delete authed.teams[team.hash.substr(0,8)]);
        }
    };

})();