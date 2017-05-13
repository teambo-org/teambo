function(t){
  "use strict";

  var form = new t.form(document.comment);
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['text', 'pid', 'ptype', 'member_id']);
    var submit = function() {
      t.model.comment.create(data).then(function(comment){
        t.app.refresh();
      }).catch(function(e){
        form.enable();
        form.error.msg("Comment could not be saved", "Please try again");
      });
    };
    submit();
  });

  t.view.autoselect.init('#main .autoselect', t.model.item.current);

  t.view.toggle.init('ul.history');

  t.view.on('item-removed', function(e) {
    if(e.id == t.model.item.current.id) {
      t.app.gotoUrl((t.model.bucket.current || t.team.current).url());
    }
  });
  t.view.on('item-updated', function(e) {
    if(e.id == t.model.item.current.id) {
      t.app.refresh({silent: true});
    }
  });
  t.view.on(['comment-updated', 'comment-removed'], function(e) {
    if(e.comment.opts.pid == t.model.item.current.id && e.comment.opts.ptype == 'item') {
      t.app.refresh({silent: true});
    }
  });
  t.view.on(['bucket-removed', 'bucket-updated'], function(e) {
    if(e.opts.bucket_id == t.model.bucket.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
