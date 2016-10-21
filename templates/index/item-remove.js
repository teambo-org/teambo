(function(t){
  "use strict";

  var form = new t.form(document.item_remove);
  form.addEventListener("submit", function(e) {
    form.disable();
    var item_id = form.item_id.value;
    var item = t.item.get(item_id);
    item.remove().then(function(){
      t.updateRightNav();
      t.gotoUrl('/'+t.team.current.id+'/'+item.opts.bucket_id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

})(Teambo);
