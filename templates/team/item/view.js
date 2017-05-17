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

  t.view.history.init(t.model.item.current);

  t.view.on('item-removed', function(e) {
    if(e.id == t.model.item.current.id) {
      t.app.gotoUrl((t.model.folder.current || t.team.current).url());
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
  t.view.on(['folder-removed', 'folder-updated'], function(e) {
    if(e.id == t.model.item.current.opts.folder_id) {
      t.app.refresh({silent: true});
    }
  });

}
