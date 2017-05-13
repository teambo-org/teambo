function(t){
  "use strict";

  t.view.progress('#main .progress');

  var hide_empty_buckets = function() {
    var buckets = document.querySelectorAll('#buckets > li');
    [].forEach.call(buckets, function(bucket, i) {
      var has_visible = false;
      var items = bucket.querySelectorAll('.items > li');
      [].forEach.call(items, function(item, i) {
        if(!has_visible && item.offsetParent) {
          has_visible = true;
        }
      });
      if(!has_visible) {
        bucket.remove();
      }
    });
  };

  var filter_form = t.form(document.filter);
  t.view.autofilter(filter_form, 'bucket-index', true).then(hide_empty_buckets);

  t.view.on(['bucket-removed', 'bucket-updated', 'item-removed', 'item-updated'], function(e) {
    t.app.refresh({silent: true});
  });

}
