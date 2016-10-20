(function(t){
  "use strict";

  var form = new t.form(document.item_remove);
  form.addEventListener("submit", function(e) {
    form.disable();
    var item_id = form.item_id.value;
    var bucket_id = form.bucket_id.value;
    t.item.remove(item_id).then(function(){
      t.updateRightNav();
      t.gotoUrl('/'+t.team.current.id+'/'+bucket_id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

})(Teambo);
