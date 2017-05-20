function(t){
  "use strict";

  var form = new t.form(document.item_remove);
  var item_id = form.item_id.value;
  var item = t.model.item.get(item_id);
  var folder = item.folder();
  form.addEventListener("submit", function(e) {
    form.disable();
    item.remove().then(function(){
      t.view.updateSideNav();
      if(t.plan.current) {
        t.app.gotoUrl(plan.url());
      } else {
        t.app.gotoUrl(folder.url());
      }
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
