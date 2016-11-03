// Based on https://github.com/allouis/minivents
Teambo.event = (function (t) {
  "use strict";
  
  function extend(target){
    var events = {}, empty = [];
    target = target || this;
    target.on = function(type, func, ctx){
      (events[type] = events[type] || []).push([func, ctx]);
    };
    target.off = function(type, func){
      type || (events = {})
      var list = events[type] || empty,
          i = list.length = func ? list.length : 0;
      while(i--) func == list[i][0] && list.splice(i,1);
    };
    target.emit = function(type){
      var e = events[type] || empty, list = e.length > 0 ? e.slice(0, e.length) : e, i=0, j;
      while(j=list[i++]) j[0].apply(j[1], empty.slice.call(arguments, 1))
    };
    target.gather = function(type){
      var e = events[type] || empty, list = e.length > 0 ? e.slice(0, e.length) : e, i=0, j;
      var p = [];
      while(j=list[i++]) {
        var res = j[0].apply(j[1], empty.slice.call(arguments, 1));
        if(res) p.push(res);
      }
      return p;
    };
  };
  
  var o = {
    extend: extend
  };
  extend(o);
  return o;

})(Teambo);
