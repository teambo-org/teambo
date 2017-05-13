function(t){
  "use strict";

  t.view.progress('#main .progress');

  if(!t.dom.isChild('right', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

  t.view.on('team-updated', function(e) {
    if(e.id == t.team.current.id) {
      t.app.refresh({silent: true});
    }
  });

  t.view.on(['plan-removed', 'plan-updated'], function(e) {
    t.app.refresh({silent: true});
  });

  t.view.on(['item-removed', 'item-updated'], function(e) {
    t.app.refresh({silent: true});
  });

}
