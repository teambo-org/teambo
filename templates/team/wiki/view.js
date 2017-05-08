function(t){
  "use strict";
  
  [].forEach.call(document.querySelectorAll('section.tags a.active'), function(el) {
    el.focus();
  });

  t.view.toggle.init('ul.history');
  
  t.view.on('wiki-removed', function(e) {
    if(e.id == t.model.wiki.current.id) {
      t.gotoUrl('/wiki');
    }
  });
  t.view.on('wiki-updated', function(e) {
    if(e.id == t.model.wiki.current.id) {
      t.refresh({silent: true});
    }
  });

}
