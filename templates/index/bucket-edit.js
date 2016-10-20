(function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.bucket_edit),
    bucket_id = form.dataset.bucket_id;
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.bucket.update(bucket_id, data).then(function(bucket){
      t.updateRightNav();
      t.gotoUrl('/'+t.team.current.id+'/'+bucket.id);
    }).catch(function(e){
      form.enable();
      t.trace(e);
      form.error.msg("Bucket changes could not be saved", "Please try again");
    });
  });

})(Teambo);
