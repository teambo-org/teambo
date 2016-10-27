function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.bucket_edit),
    bucket_id = form.dataset.bucket_id,
    bucket = t.bucket.get(bucket_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    var submit = function() {
      bucket.update(data).then(function(bucket){
        t.updateSideNav();
        t.gotoUrl(bucket.url);
      }).catch(function(xhr){
        if(xhr.status === 409) {
          var opts = t.clone(bucket.opts);
          bucket.refresh().then(function(new_bucket){
            // Only overwrite changed properties
            for(var i in opts) {
              if(data[i] != opts[i]) {
                new_bucket[i] = data[i];
              }
            }
            bucket = new_bucket;
            submit();
          });
        } else {
          form.enable();
          form.error.msg("Bucket could not be saved", "Please try again");
        }
      });
    };
    submit();
  });

}
