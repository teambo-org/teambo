// Based on https://github.com/allouis/minivents
Teambo.event = (function (t) {
  "use strict";
  
  function extend(target){
    var events = {}, empty = [];
    var once = {};
    target = target || this;
    target.on = function(type, func, ctx){
      (events[type] = events[type] || []).push([func, ctx]);
    };
    target.once = function(type, func, ctx){
      (once[type] = once[type] || []).push([func, ctx]);
    };
    target.off = function(type, func){
      type || (events = {})
      var list = events[type] || empty,
          i = list.length = func ? list.length : 0;
      while(i--) func == list[i][0] && list.splice(i,1);
    };
    target.emit = function(type){
      var e = events[type] || empty;
      var list = e.length > 0 ? e.slice(0, e.length) : e;
      var args = [].slice.call(arguments, 1);
      list = list.concat(once[type] || empty);
      list.forEach(function(e) {
        e[0].apply(e[1], args)
      });
      once[type] = [];
    };
    target.gather = function(type){
      var e = events[type] || empty;
      var list = e.length > 0 ? e.slice(0, e.length) : e;
      var args = [].slice.call(arguments, 1);
      var p = [];
      list = list.concat(once[type] || empty);
      list.forEach(function(e) {
        var res = e[0].apply(e[1], args);
        if(res) {
          p.push(res);
        }
      });
      once[type] = [];
      return p;
    };
    return target;
  };
  
  var event = {
    extend: extend
  };
  return extend(event);

})(Teambo);
