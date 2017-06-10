function(t){
  "use strict";

  t.view.on('folder-removed', function(e) {
    if(e.id == t.model.folder.current.id) {
      t.app.gotoUrl(t.team.current.url());
    }
  });
  t.view.on('folder-updated', function(e) {
    if(e.id == t.model.folder.current.id) {
      t.app.refresh({silent: true});
    }
  });
  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.folder_id == t.model.folder.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
