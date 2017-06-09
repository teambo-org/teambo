function(t){
  "use strict";

  t.view.history.init(t.model.wiki.current);

  t.view.on('wiki-removed', function(e) {
    if(e.id == t.model.wiki.current.id) {
      t.app.gotoUrl('/wiki');
    }
  });
  t.view.on('wiki-updated', function(e) {
    if(e.id == t.model.wiki.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
