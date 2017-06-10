function(t){
  "use strict";

  t.view.progress('#main .progress');

  var filter_form = t.form(document.filter);
  t.view.autofilter(filter_form, 'plan-index', true);

  t.view.on(['plan-removed', 'plan-updated'], function(e) {
    t.app.refresh({silent: true});
  });

  t.view.on(['item-removed', 'item-updated'], function(e) {
    if(e.item.opts.plan_id == t.model.plan.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
