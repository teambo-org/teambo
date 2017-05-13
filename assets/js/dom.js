Teambo.dom = (function(t){
  "use strict";
  
  return {
    isChild: function(parent, child) {
      if(child == null) {
        return false;
      }
      var p = document.getElementById(parent);
      var node = child.parentNode;
      while (node != null) {
        if (node == p) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    },
    findParent: function(el, selector) {
      var parent;
      while(parent = el.parentNode) {
        if(!parent.matches) {
          return;
        }
        if(parent.matches(selector)) {
          return parent;
        }
        el = parent;
      }
    },
    matchParent: function(el, selector) {
      return el.matches(selector) ? el : t.dom.findParent(el, selector);
    }
  };

})(Teambo);
