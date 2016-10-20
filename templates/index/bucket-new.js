(function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.bucket_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.bucket.create(data).then(function(bucket){
      t.updateRightNav();
      t.gotoUrl('/'+t.team.current.id+'/'+bucket.id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Bucket could not be created", "Please try again");
    });
  });

})(Teambo);
