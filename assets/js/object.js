Teambo.object = (function (t) {
  "use strict";

  var object = {
    extend: function(target, obj) {
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          target[i] = obj[i];
        }
      }
      return target;
    },
    clone: function(obj) {
      return object.extend({}, obj);
    },
    watchable: function(obj){
      if(!Object.prototype.watch) {
        Object.defineProperty(obj, "watch", {
          enumerable: false,
          configurable: true,
          writable: false,
          value: function (prop, handler) {
            var oldval = this[prop];
            var newval = oldval;
            var getter = function () {
              return newval;
            };
            var setter = function (val) {
              oldval = newval;
              newval = val;
              return handler.call(this, prop, oldval, val);
            };
            Object.defineProperty(this, prop, {
              get: getter,
              set: setter,
              enumerable: true,
              configurable: true
            });
          }
        });
      }
      if(!Object.prototype.unwatch) {
        Object.defineProperty(obj, "unwatch", {
          enumerable: false,
          configurable: true,
          writable: false,
          value: function (prop) {
            var val = this[prop];
            delete this[prop]; // remove accessors
            this[prop] = val;
          }
        });
      }
    }
  };

  return object;

})(Teambo);
