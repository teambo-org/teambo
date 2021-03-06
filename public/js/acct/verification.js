Teambo.acct.verification = (function (t) {
  "use strict";

  var verification = {
    send : function (email, pass, opts) {
      opts = opts ? opts : {};
      if(!email || !pass) {
        return Promise.reject();
      }
      var id   = t.crypto.sha(email);
      var key  = t.crypto.pbk(pass, email);
      var akey = t.crypto.pbk(pass, id + key);
      var pkey = t.crypto.pbk(pass, id + key + id);
      return new Promise(function (fulfill, reject) {
        var xhr_data = {
          email: email,
          akey:  akey
        };
        if(opts.beta) {
          xhr_data.beta = opts.beta;
        }
        if(opts.news) {
          xhr_data.news = opts.news;
        }
        if(opts.ikey && opts.ichk) {
          xhr_data.ikey = opts.ikey;
          xhr_data.ihash = t.crypto.sha(opts.ikey+opts.ichk+email);
        }
        t.xhr.post('/acct/verification', {
          data: xhr_data
        }).then(function (xhr){
          var data = JSON.parse(xhr.responseText);
          if(xhr.status == 201) {
            if('vkey' in data) {
              verification.confirm(data.vkey, email, pass, {news: opts.news}).then(function(){
                fulfill(xhr);
              });
            } else {
              if(t.app.easy_verification) {
                localforage.setItem('verification', {
                  email: email,
                  key:  key,
                  akey: akey,
                  pkey: pkey,
                  news: opts.news
                });
              }
              fulfill(xhr);
            }
          } else {
            reject(xhr);
          }
        }).catch(reject);
      });
    },
    confirm : function(vkey, email, pass, opts) {
      opts = opts ? opts : {};
      var id, key, akey, pkey;
      var news = opts.news ? opts.news : false;
      return new Promise(function (fulfill, reject) {
        var send_confirmation = function () {
          var iv = t.crypto.iv();
          var new_acct = new t.acct({
            email: email,
            id:    id,
            teams: [],
            opts:  {},
            iv:    iv
          }, akey, key);
          var ct = new_acct.encrypted({iv: iv});
          t.xhr.post('/acct/verification', {
            data: {id: id, akey: akey, vkey: vkey, pkey: pkey, ct: ct, email: email, news: news}
          }).then(function (xhr){
            if(xhr.status == 200) {
              if(t.app.easy_verification) {
                localforage.removeItem('verification');
              }
              t.acct.current = new_acct;
              fulfill(xhr)
            } else {
              reject(xhr);
            }
          }).catch(function (e) {
            reject(e);
          });
        };
        if (!email || !pass) {
          if(t.app.easy_verification) {
            localforage.getItem('verification').then(function (v) {
              if(v) {
                email = v.email;
                id    = t.crypto.sha(email);
                key   = v.key;
                akey  = v.akey;
                pkey  = v.pkey;
                news  = v.news;
                send_confirmation();
              } else {
                reject("Verification not found");
              }
            });
          } else {
            reject("Email and password required for verification");
          }
        } else {
          id   = t.crypto.sha(email);
          key  = t.crypto.pbk(pass, email);
          akey = t.crypto.pbk(pass, id + key);
          pkey = t.crypto.pbk(pass, id + key + id);
          send_confirmation();
        }
      });
    }
  };

  return verification;

})(Teambo);
