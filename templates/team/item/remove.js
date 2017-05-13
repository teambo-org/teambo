function(t){
  "use strict";

  var form = new t.form(document.item_remove);
  var item_id = form.item_id.value;
  var item = t.model.item.get(item_id);
  var bucket = item.bucket();
  form.addEventListener("submit", function(e) {
    form.disable();
    item.remove().then(function(){
      t.view.updateSideNav();
      t.app.gotoUrl(bucket.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
