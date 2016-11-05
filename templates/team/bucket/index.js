function(t){
  "use strict";

  var els = document.querySelectorAll('#main .progress');
  for(var i = 0; els[i]; i++) {
    els[i].style.width = Math.abs(100-parseFloat(els[i].dataset.progress)) + "%";
  }

  t.view.on(['bucket-removed', 'bucket-updated', 'item-removed', 'item-updated'], function(e) {
    t.refresh({silent: true});
  });

}
