// Copyright (c) 2011  Kevin M Burns Jr.
// All Rights Reserved.
// See "LICENSE" for details.
//
// Extension to jsbn which adds facilities for asynchronous RSA key generation
// Primarily created to avoid execution timeout on mobile devices
//
// http://www-cs-students.stanford.edu/~tjw/jsbn/
//
// ---

(function(){

// Generate a new random private key B bits long, using public expt E
var RSAGenerateAsync = function (B, E, callback, progressCallback) {
    //var rng = new SeededRandom();
    var qs = B >> 1;
    this.e = parseInt(E, 16);
    var ee = new BigInteger(E, 16);
    var rng = new SecureRandom();
    var rsa = this;
    var progress = 0;
    progressCallback = typeof progressCallback === 'undefined' ? function(){} : progressCallback;
    // These functions have non-descript names because they were originally for(;;) loops.
    // I don't know enough about cryptography to give them better names than loop1-4.
    var loop1 = function() {
        var loop4 = function() {
            progress++;
            progressCallback(progress);
            if (rsa.p.compareTo(rsa.q) <= 0) {
                var t = rsa.p;
                rsa.p = rsa.q;
                rsa.q = t;
            }
            var p1 = rsa.p.subtract(BigInteger.ONE);
            var q1 = rsa.q.subtract(BigInteger.ONE);
            var phi = p1.multiply(q1);
            if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
                rsa.n = rsa.p.multiply(rsa.q);
                rsa.d = ee.modInverse(phi);
                rsa.dmp1 = rsa.d.mod(p1);
                rsa.dmq1 = rsa.d.mod(q1);
                rsa.coeff = rsa.q.modInverse(rsa.p);
                setTimeout(callback,0); // escape
            } else {
                setTimeout(loop1,0);
            }
        };

        var qdone = false,
            pdone = false;
        var loop3 = function() {
            rsa.q = nbi();
            rsa.q.fromNumberAsync(qs, 1, rng, function(){
                progress++;
                progressCallback(progress);
                rsa.q.subtract(BigInteger.ONE).gcda(ee, function(r){
                    progress++;
                    progressCallback(progress);
                    if (r.compareTo(BigInteger.ONE) == 0 && rsa.q.isProbablePrime(10)) {
                        // qdone = true;
                        // if(pdone) setTimeout(loop4,0);
                        setTimeout(loop4,0);
                    } else {
                        setTimeout(loop3,0);
                    }
                });
            });
        };
        // setTimeout(loop3,0);
        var loop2 = function() {
            rsa.p = nbi();
            rsa.p.fromNumberAsync(B - qs, 1, rng, function(){
                progress++;
                progressCallback(progress);
                rsa.p.subtract(BigInteger.ONE).gcda(ee, function(r){
                    progress++;
                    progressCallback(progress);
                    if (r.compareTo(BigInteger.ONE) == 0 && rsa.p.isProbablePrime(10)) {
                        // pdone = true;
                        // if(qdone) setTimeout(loop4,0);
                        setTimeout(loop3,0);
                    } else {
                        setTimeout(loop2,0);
                    }
                });
            });
        };
        setTimeout(loop2,0);
        progress++;
        progressCallback(progress);
    };
    setTimeout(loop1,0);
};
RSAKey.prototype.generateAsync = RSAGenerateAsync;


// Public API method
var bnGCDAsync = function (a, callback) {
    var x = (this.s < 0) ? this.negate() : this.clone();
    var y = (a.s < 0) ? a.negate() : a.clone();
    if (x.compareTo(y) < 0) {
        var t = x;
        x = y;
        y = t;
    }
    var i = x.getLowestSetBit(),
        g = y.getLowestSetBit();
    if (g < 0) {
        callback(x);
        return;
    }
    if (i < g) g = i;
    if (g > 0) {
        x.rShiftTo(g, x);
        y.rShiftTo(g, y);
    }
    // Workhorse of the algorithm, gets called 200 - 800 times per 512 bit keygen.
    var starttime = +new Date();
    var gcda1 = function() {
        if ((i = x.getLowestSetBit()) > 0){ x.rShiftTo(i, x); }
        if ((i = y.getLowestSetBit()) > 0){ y.rShiftTo(i, y); }
        if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
        } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
        }
        if(x.signum() <= 0) {
            if (g > 0) y.lShiftTo(g, y);
            setTimeout(function(){callback(y);},0); // escape
        } else {
            // Only set timeout if it's been running for 5 seconds
            if(+new Date() < starttime + 1000) {
                gcda1();
            } else {
                starttime = +new Date();
                setTimeout(gcda1,0);
            }
        }
    };
    setTimeout(gcda1,10);
};
BigInteger.prototype.gcda = bnGCDAsync;

// (protected) alternate constructor
var bnpFromNumberAsync = function (a,b,c,callback) {
    var starttime = +new Date();
    if("number" == typeof b) {
        if(a < 2) {
            this.fromInt(1);
        } else {
            this.fromNumber(a,c);
            if(!this.testBit(a-1)){
                this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
            }
            if(this.isEven()) {
                this.dAddOffset(1,0);
            }
            var bnp = this;
            var bnpfn1 = function(){
                bnp.dAddOffset(2,0);
                if(bnp.bitLength() > a) bnp.subTo(BigInteger.ONE.shiftLeft(a-1),bnp);
                if(bnp.isProbablePrime(b)) {
                    setTimeout(callback,0); // escape
                } else {
                    // Only set timeout if it's been running for 5 seconds
                    if(+new Date() < starttime + 1000) {
                        bnpfn1();
                    } else {
                        starttime = +new Date();
                        setTimeout(bnpfn1,0);
                    }
                }
            };
            setTimeout(bnpfn1,0);
        }
    } else {
        var x = [], t = a&7;
        x.length = (a>>3)+1;
        b.nextBytes(x);
        if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
        this.fromString(x,256);
    }
};
BigInteger.prototype.fromNumberAsync = bnpFromNumberAsync;

// Cast to private Transport Object
var RSAPrivTPO = function () {
    return {
        'e'     : this.e.toString(16),
        'd'     : hex2b64(this.d.toString(16)),
        'p'     : hex2b64(this.p.toString(16)),
        'q'     : hex2b64(this.q.toString(16))
    };
};
RSAKey.prototype.privTPO = RSAPrivTPO;

// Hydrate from private Transport Object
var RSAFromPrivTPO = function (tpo) {
    this.e = parseInt(tpo.e, 16);
    this.d = parseBigInt(b64tohex(tpo.d),16);
    this.p = parseBigInt(b64tohex(tpo.p),16);
    this.q = parseBigInt(b64tohex(tpo.q),16);
    this.n = this.p.multiply(this.q);
    this.dmp1 = this.d.mod(this.p.subtract(BigInteger.ONE));
    this.dmq1 = this.d.mod(this.q.subtract(BigInteger.ONE));
    this.coeff = this.q.modInverse(this.p);
    return this;
};
RSAKey.prototype.fromPrivTPO = RSAFromPrivTPO;

// Cast to public Transport Object
var RSAPubTPO = function () {
    return {
        'n' : hex2b64(this.n.toString(16)),
        'e' : this.e.toString(16)
    };
};
RSAKey.prototype.pubTPO = RSAPubTPO;

// Hydrate from public Transport Object
var RSAFromPubTPO = function (tpo) {
    this.setPublic(
        b64tohex(tpo.n),
        tpo.e
    );
    return this;
};
RSAKey.prototype.fromPubTPO = RSAFromPubTPO;

})();
