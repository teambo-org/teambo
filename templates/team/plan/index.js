function(t){
  "use strict";

  t.view.progress('#main .progress');

  t.view.on(['plan-removed', 'plan-updated'], function(e) {
    t.refresh({silent: true});
  });
  
  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.plan_id == t.model.plan.current.id) {
      t.refresh({silent: true});
    }
  });

}
