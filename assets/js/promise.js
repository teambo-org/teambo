Teambo.promise = (function (t) {
  "use strict";

  var promise = {
    serial: function(fns) {
      return new Promise(function(fulfill, reject) {
        if(fns.length) {
          // Pop the first function and set it off
          var fn = fns.shift();
          fn().then(function() {
            // If it succeeded, we continue processing the list recursively
            promise.serial(fns).then(function() {
              // Cascade success
              fulfill();
            }).catch(function(e) {
              // Cascade failure
              reject(e);
            });
          }).catch(function(e) {
            // One of the functions failed so we reject and
            // let the failure cascade back to the caller
            reject(e);
          });
        } else {
          // Reached the end of the list, we're done
          fulfill();
        }
      });
    }
  };

  return promise;

})(Teambo);
