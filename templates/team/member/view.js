function(t){
  "use strict";

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
  t.view.autofilter(filter_form, 'member-view', true).then(hide_empty_buckets);

  t.view.on('member-removed', function(e) {
    if(e.id == t.model.member.current.id) {
      t.gotoUrl(t.team.current.url(), false, {silent: true});
    }
  });
  t.view.on('member-updated', function(e) {
    if(e.id == t.model.member.current.id) {
      t.refresh({silent: true});
    }
  });

}
