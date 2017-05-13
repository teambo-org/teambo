Teambo.event = (function (t) {
  "use strict";

  function extend(target){
    if(!target) return;
    var events = {};
    var once = {};
    var key = Math.random();
    target.on = function(types, fn) {
      types = typeof types === "string" ? [types] : types;
      if(Array.isArray(types)) {
        types.forEach(function(type) {
          events[type] = events[type] || [];
          events[type].push(fn);
        });
      }
    };
    target.once = function(type, fn) {
      once[type] = once[type] || [];
      once[type].push(fn);
    };
    target.off = function(type) {
      if(!type) {
        events = {};
        once = {};
        key = Math.random();
      } else {
        events[type] = [];
        once[type] = [];
      }
    };
    target.emit = function(type, arg) {
      var queue = [].concat(events[type] || []).concat(once[type] || []);
      var k = key;
      var p = [];
      queue.forEach(function(fn) {
        if(k != key) {
          return;
        }
        p.push(fn(arg));
      });
      once[type] = [];
      return p;
    };
    target.all = function(type, arg) {
      return Promise.all(target.emit(type, arg));
    };
    return target;
  };

  return extend({
    extend: extend
  });

})(Teambo);
