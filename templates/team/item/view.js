function(t){
  "use strict";
  
  t.view.on('item-removed', function(e) {
    if(e.id == t.model.item.current.id) {
      t.gotoUrl((t.model.bucket.current || t.team.current).url());
    }
  });
  t.view.on('item-updated', function(e) {
    if(e.id == t.model.item.current.id) {
      t.refresh({silent: true});
    }
  });
  t.view.on(['bucket-removed', 'bucket-updated'], function(e) {
    if(e.opts.bucket_id == t.model.bucket.current.id) {
      t.refresh({silent: true});
    }
  });

}
