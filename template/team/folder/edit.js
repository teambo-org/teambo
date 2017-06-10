function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.folder_edit),
    folder_id = form.dataset.folder_id,
    folder = t.model.folder.get(folder_id);
  // form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    folder.update(data, true).then(function(folder){
      t.view.updateSideNav();
      t.app.gotoUrl(folder.url());
    }).catch(function(xhr){
      form.enable();
      form.error.msg("Folder could not be saved", "Please try again");
    });
  });

}
