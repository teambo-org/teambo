function(t){
  "use strict";

  if(!t.isChild('right', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

  t.view.on(['bucket-removed', 'bucket-updated', 'item-removed', 'item-updated'], function(e) {
    t.refresh({silent: true});
  });

}
