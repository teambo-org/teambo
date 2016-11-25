Teambo.view.progress = (function(t){
  "use strict";

  return function(selector) {
    var els = document.querySelectorAll(selector);
    for(var i = 0; els[i]; i++) {
      els[i].style.width = Math.abs(100-parseFloat(els[i].dataset.progress)) + "%";
    }
  };

})(Teambo);
