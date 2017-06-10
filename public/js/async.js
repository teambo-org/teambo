Teambo.async = (function (t) {
  "use strict";

  return {
    loadJs : function(scripts) {
      scripts.forEach(function(src) {
        var el = document.createElement('script');
        el.type = 'text/javascript';
        el.async = true;
        el.src = src;
        document.head.appendChild(el);
      });
    }
  };

})(Teambo);
