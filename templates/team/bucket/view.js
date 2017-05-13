function(t){
  "use strict";

  if(!t.dom.isChild('right', document.activeElement) && !t.dom.isChild('left', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

  t.view.on('bucket-removed', function(e) {
    if(e.id == t.model.bucket.current.id) {
      t.app.gotoUrl(t.team.current.url(), false, {silent: true});
    }
  });
  t.view.on('bucket-updated', function(e) {
    if(e.id == t.model.bucket.current.id) {
      t.app.refresh({silent: true});
    }
  });
  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.bucket_id == t.model.bucket.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
