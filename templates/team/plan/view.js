function(t){
  "use strict";

  if(!t.isChild('right', document.activeElement) && !t.isChild('left', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

  t.view.on('plan-removed', function(e) {
    if(e.id == t.model.plan.current.id) {
      t.gotoUrl(t.team.current.url(), false, {silent: true});
    }
  });
  t.view.on('plan-updated', function(e) {
    if(e.id == t.model.plan.current.id) {
      t.refresh({silent: true});
    }
  });
  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.plan_id == t.model.plan.current.id) {
      t.refresh({silent: true});
    }
  });

}
