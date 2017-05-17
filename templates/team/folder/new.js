function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.folder_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.model.folder.create(data).then(function(folder){
      t.view.updateSideNav();
      t.app.gotoUrl(folder.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Folder could not be created", "Please try again");
    });
  });

}
