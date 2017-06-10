function(t){
  "use strict";

  var form = new t.form(document.folder_remove);
  form.addEventListener("submit", function(e) {
    form.disable();
    var id = form.id.value;
    t.model.folder.get(id).remove().then(function(){
      t.view.updateSideNav();
      t.app.gotoUrl(t.team.current.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Folder could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
