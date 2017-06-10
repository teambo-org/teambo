function(t){
  "use strict";

  t.view.progress('#main .progress');

  var hide_empty_folders = function() {
    var folders = document.querySelectorAll('#folders > li');
    [].forEach.call(folders, function(folder, i) {
      var has_visible = false;
      var items = folder.querySelectorAll('.items > li');
      [].forEach.call(items, function(item, i) {
        if(!has_visible && item.offsetParent) {
          has_visible = true;
        }
      });
      if(!has_visible) {
        folder.remove();
      }
    });
  };

  var filter_form = t.form(document.filter);
  t.view.autofilter(filter_form, 'folder-index', true).then(hide_empty_folders);

  t.view.on(['folder-removed', 'folder-updated', 'item-removed', 'item-updated'], function(e) {
    t.app.refresh({silent: true});
  });

}
