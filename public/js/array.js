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
    findAllByProperty: function(a, k, v) {
      var ret = [];
      a.forEach(function(o) {
        if(typeof o === 'object' && o[k] === v) {
          ret.push(o);
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
    },
    moveProperty: function(a, k1, k2, prefix) {
      a.forEach(function(o) {
        if(prefix) {
          if(typeof o === 'object' && prefix in o && k1 in o[prefix]) {
            o[prefix][k2] === o[prefix][k1];
            delete o[prefix][k1];
          }
        } else {
          if(typeof o === 'object' && k1 in o) {
            o[k2] === o[k1];
            delete o[k1];
          }
        }
      });
    }
  };

})(Teambo);
