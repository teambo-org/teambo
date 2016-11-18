function(t){
  "use strict";

  t.view.progress('#main .progress');

  var filter_form = t.form(document.filter);
  t.view.autofilter(filter_form, 'bucket-index', true);

  t.view.on(['bucket-removed', 'bucket-updated', 'item-removed', 'item-updated'], function(e) {
    t.refresh({silent: true});
  });

}
