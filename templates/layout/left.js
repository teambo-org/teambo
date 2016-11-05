function(t){
  "use strict";

  var els = document.querySelectorAll('#left .progress');
  for(var i = 0; els[i]; i++) {
    els[i].style.width = Math.abs(100-parseFloat(els[i].dataset.progress)) + "%";
  }

}
