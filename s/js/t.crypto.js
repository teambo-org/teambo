(function(){
    "use strict";

    var e = 65537,
        acct = {
            uuid     : null, // Client assigned UUID
            pbk      : null, // Password
            key      : null, // RSA key
            options  : {},
            teams    : {}
        },
        team = {
            uuid     : null, // Client assigned UUID
            pbk      : null, // Password
            key      : null, // RSA key
            options  : {},
            milestones : {}
        };

    t.crypto = {};

    if(t.debug()) {
        t.crypto.debug = function() {
            return auth;
        };
    }

    t.crypto.clear = function() {
        auth.uuid = null;
        auth.pbk = null;
        auth.key = null;
        auth.options = {};
        auth.teams = {};
        amplify.store.localStorage('creds', null);
    };

    t.crypto.test = function() {
        return auth.key.decrypt(auth.key.encrypt('test')) === 'test';
    };

    t.crypto.sha = function(str) {
        return sjcl.codec.base64.fromBits(sjcl.hash.sha256.hash(str));
    };
    
    t.crypto.pbk = function(str, salt, iter) {
        iter = typeof iter === 'undefined' ? 10000 : iter;
        var key = sjcl.misc.cachedPbkdf2(str, {salt:salt, iter:iter}).key;
        return sjcl.codec.base64.fromBits(key);
    };
    t.crypto.akey = function(str, salt, iter) {
        return t.crypto.sha(t.crypto.pbk(str, salt + salt));
    };

    t.crypto.randomKey = function() {
        return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8,0)).slice(0,-2);
    };

    t.encrypt = function(data, key, iter) {
        iter = typeof iter === 'undefined' ? 10000 : iter;
        var passBitArray = sjcl.codec.base64.toBits(key);
        var crypt = sjcl.encrypt(passBitArray, JSON.stringify(data), {
            mode:'ccm',
            iter:iter,
            ks:256,
            ts:64
        });
        var data = JSON.parse(crypt);
        return data.iv + " " + data.ct
    };

    t.decrypt = function(data, key, iter) {
        iter = typeof iter === 'undefined' ? 10000 : iter;
        var iv = data.split(" ")[0],
            ct = data.split(" ")[1];
        var passBitArray = sjcl.codec.base64.toBits(key);
        var json = sjcl.decrypt(passBitArray, sjcl.json.encode({
            iv: iv,
            v:1,
            iter:iter,
            ks:256,
            ts:64,
            mode: "ccm",
            adata: "",
            cipher: "aes",
            ct: ct
        }));
        return JSON.parse(json);
    };

    var b64tohex = function(input) {
        return sjcl.codec.hex.fromBits(sjcl.codec.base64.toBits(input));
    };

    var hextob64 = function(input) {
        return sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(input));
    };

    var strtohex = function(input) {
        return sjcl.codec.hex.fromBits(sjcl.codec.utf8String.toBits(input));
    };

})();