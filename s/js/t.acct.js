(function(){
    "use strict";
    
    var authed;
    
    t.acct = function(data) {
        t.extend(this, data);
    };
    
    t.extend(t.acct, {
        init: function() {
            var auth = sessionStorage.getItem('auth');
            if(auth) {
                var data = JSON.parse(auth),
                    acct = localforage.getItem('acct-'+data.hash);
                if(acct) {
                    authed = new t.acct(t.decrypt(acct, data.pbk));
                }
            }
        },
        save: function() {
            if(!authed) {
                return Promise.reject('Not authed');
            }
            return new Promise(function(fulfill, reject) {
                t.xhr.put('/acct', {
                    data: {
                        email: authed.email,
                        akey:  authed.akey,
                        ct:    authed.encrypt()
                    }
                }).done(function(xhr){
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
        },
        encrypt: function() {
            if(!authed) {
                return;
            }
            return t.encrypt({
                id:    authed.id,
                akey:  authed.akey,
                email: authed.email,
                teams: authed.teams,
                opts:  authed.opts
            }, authed.pbk);
        },
        auth: function(email, pass) {
            var hash = t.crypto.sha(email),
                akey = t.crypto.akey(email, pass);
            return new Promise(function(fulfill, reject){
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
                            reject('What is happening');
                        }
                        authed = new t.acct(t.decrypt(data.ct, pbk));
                        t.acct.cache();
                    }
                    fulfill(xhr);
                }).catch(function(e){
                    reject(e);
                });
            });
        },
        cache: function() {
            localforage.getItem('salt').then(function(salt){
                if(!salt) {
                    salt = t.crypto.randomKey();
                    localforage.setItem('salt', salt);
                }
                var hash = t.crypto.sha(authed.email+salt);
                sessionStorage.setItem('auth', JSON.stringify({hash: hash, pbk: authed.pbk}));
                localforage.setItem('acct-'+hash, authed.encrypt());
            });
        },
        authed: function() {
            return authed === null;
        }
    });
    
    t.acct.verification = {
        send : function(email, pass) {
            if(!email || !pass) {
                return Promise.reject();
            }
            var pbk   = t.crypto.pbk(pass, email),
                akey  = t.crypto.akey(pass, email);
            return new Promise(function(fulfill, reject) {
                t.xhr.post('/acct/verification', {
                    data: {
                        email: email,
                        akey:  akey
                    }
                }).then(function(xhr){
                    if(xhr.status == 201) {
                        localforage.setItem('verification', JSON.stringify({
                            hash: t.crypto.sha(email),
                            akey: akey,
                            pbk:  pbk
                        }));
                        fulfill(xhr);
                    }
                }).catch(function(e){
                    reject(e);
                });
            });
        },
        confirm : function(vkey, email, pass) {
            var pbk, akey, hash;
            return new Promise(function(fulfill, reject) {
                var send_confirmation = function() {
                    t.xhr.post('/acct/verification', {
                        data: {
                            hash: hash,
                            akey: akey,
                            vkey: vkey
                        }
                    }).then(function(xhr){
                        if(xhr.status == 200) {
                            var data = JSON.parse(xhr.responseText);
                            authed = new t.acct({
                                id:    data.id,
                                hash:  hash,
                                akey:  akey,
                                teams: {},
                                opts:  {}
                            });
                            t.acct.save().then(function(){
                                console.log('asdf');
                                localforage.removeItem('verification');
                                fulfill(xhr);
                            }).catch(function(e){
                                reject(e);
                            })
                        } else {
                            reject(xhr);
                        }
                    }).catch(function(e){
                        reject(e);
                    });
                }
                if(!email || !pass) {
                    localforage.getItem('verification').then(function(val){
                        if(val) {
                            var v = JSON.parse(val);
                            hash = v.hash;
                            akey = v.akey;
                            pbk  = v.pbk;
                            send_confirmation();
                        } else {
                            reject("Verification not found");
                        }
                    });
                } else {
                    hash = t.crypto.sha(email);
                    akey = t.crypto.akey(pass, email);
                    pbk  = t.crypto.pbk(pass, email);
                    send_confirmation();
                }
            });
        }
    };
    
    if(t.debug) {
        t.acct.debug = function() {
            return authed;
        };
    }

})();