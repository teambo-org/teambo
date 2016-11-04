function(t){
  "use strict";

  if(!t.isChild('right', document.activeElement) && !t.isChild('left', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

  t.view.on('bucket-removed', function(e) {
    if(e.id == t.bucket.current.id) {
      t.gotoUrl(t.team.current.url(), false, {silent: true});
    }
  });
  t.view.on('bucket-updated', function(e) {
    if(e.id == t.bucket.current.id) {
      t.refresh({silent: true});
    }
  });
  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.bucket_id == t.bucket.current.id) {
      t.refresh({silent: true});
    }
  });

}
