Teambo.crypto = (function(t, sjcl){
    "use strict";

    var e = 65537;

    var b64tohex = function(input) {
        return sjcl.codec.hex.fromBits(sjcl.codec.base64.toBits(input));
    };

    var hextob64 = function(input) {
        return sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(input));
    };

    var strtohex = function(input) {
        return sjcl.codec.hex.fromBits(sjcl.codec.utf8String.toBits(input));
    };
    
    return {
        sha: function(str) {
            return sjcl.codec.base64.fromBits(sjcl.hash.sha256.hash(str));
        },
        pbk: function(str, salt, iter) {
            iter = typeof iter === 'undefined' ? 10000 : iter;
            var key = sjcl.misc.cachedPbkdf2(str, {salt:salt, iter:iter}).key;
            return sjcl.codec.base64.fromBits(key);
        },
        randomKey: function() {
            return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8,0)).slice(0,-2);
        },
        tempKey: function() {
            return this.randomKey().replace(/[^0-9a-zA-Z]/, '').substr(0,8);
        },
        encrypt: function(data, key, iter) {
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
        },
        decrypt: function(data, key, iter) {
            iter = typeof iter === 'undefined' ? 10000 : iter;
            try {
                var iv = data.split(" ")[0],
                    ct = data.split(" ")[1],
                    passBitArray = sjcl.codec.base64.toBits(key);
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
            } catch(e) {
                return null;
            }
        }
    };

})(Teambo, sjcl);
