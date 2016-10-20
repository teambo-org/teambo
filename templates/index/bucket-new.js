(function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.bucket_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var name = form.name.value;
    t.bucket.create(name).then(function(bucket){
      document.getElementById('right').innerHTML = t.view.render('dashboard/right');
      t.gotoUrl('/'+t.team.current.id+'/'+bucket.id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Bucket could not be created", "Please try again");
    });
  });

})(Teambo);
