function(t){
  "use strict";

  var form = new t.form(document.bucket_remove);
  form.addEventListener("submit", function(e) {
    form.disable();
    var id = form.id.value;
    t.bucket.get(id).remove().then(function(){
      t.updateRightNav();
      t.gotoUrl(t.team.current.url);
    }).catch(function(e){
      form.enable();
      form.error.msg("Bucket could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
