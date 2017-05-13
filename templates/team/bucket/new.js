function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.bucket_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.model.bucket.create(data).then(function(bucket){
      t.view.updateSideNav();
      t.app.gotoUrl(bucket.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Bucket could not be created", "Please try again");
    });
  });

}
