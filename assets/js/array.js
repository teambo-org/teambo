Teambo.array = (function (t) {
  "use strict";

  return {
    remove : function(a, v) {
      for(var i = a.length - 1; i >= 0; i--) {
        if(a[i] === v) {
           a.splice(i, 1);
        }
      }
      return a;
    },
    findByProperty: function(a, k, v) {
      var ret = null;
      a.forEach(function(o) {
        if(typeof o === 'object' && o[k] === v) {
          ret = o;
        }
      });
      return ret;
    },
    deleteByProperty: function(a, k, v) {
      a.forEach(function(o, i) {
        if(typeof o === 'object' && o[k] === v) {
          a.splice(i, 1);
        }
      });
      return a;
    }
  };

})(Teambo);
