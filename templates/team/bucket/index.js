function(t){
  "use strict";

  t.view.progress('#main .progress');

  var filter = t.form(document.filter);
  filter.autofilter('bucket-index', true);

  t.view.on(['bucket-removed', 'bucket-updated', 'item-removed', 'item-updated'], function(e) {
    t.refresh({silent: true});
  });

}
