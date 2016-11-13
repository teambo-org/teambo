function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.bucket_edit),
    bucket_id = form.dataset.bucket_id,
    bucket = t.model.bucket.get(bucket_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    bucket.update(data, true).then(function(bucket){
      t.view.updateSideNav();
      t.gotoUrl(bucket.url());
    }).catch(function(xhr){
      form.enable();
      form.error.msg("Bucket could not be saved", "Please try again");
    });
  });

}
