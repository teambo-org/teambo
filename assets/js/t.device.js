Teambo.device = (function(t){
  "use strict";

  var getSalt = function() {
    if(t.salt) {
      return Promise.resolve(t.salt);
    } else {
      return t.promise(function(fulfill, reject) {
        localforage.getItem('salt').then(function(salt){
          if(!salt) {
            salt = t.crypto.randomKey();
            localforage.setItem('salt', salt);
          }
          t.salt = salt;
          fulfill(salt);
        });
      });
    }
  };

  var device = {};

  device.init = function() {
    return getSalt();
  };

  return device;

})(Teambo);
