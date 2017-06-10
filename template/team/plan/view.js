function(t){
  "use strict";

  t.view.on('plan-removed', function(e) {
    if(e.id == t.model.plan.current.id) {
      t.app.gotoUrl(t.team.current.url());
    }
  });
  t.view.on('plan-updated', function(e) {
    if(e.id == t.model.plan.current.id) {
      t.app.refresh({silent: true});
    }
  });
  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.plan_id == t.model.plan.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
