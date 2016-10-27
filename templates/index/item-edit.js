function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_edit),
    bucket_id = form.dataset.bucket_id,
    item_id = form.dataset.item_id,
    item = t.item.get(item_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'status', 'bucket_id']);
    var submit = function() {
      item.update(data).then(function(item){
        t.updateSideNav();
        t.gotoUrl(item.url);
      }).catch(function(xhr){
        if(xhr.status === 409) {
          var opts = t.clone(item.opts);
          item.refresh().then(function(new_item){
            // Only overwrite changed properties
            for(var i in opts) {
              if(data[i] != opts[i]) {
                new_item[i] = data[i];
              }
            }
            item = new_item;
            submit();
          });
        } else {
          form.enable();
          form.error.msg("Item could not be saved", "Please try again");
        }
      });
    };
    submit();
  });
  var html = '';
  for(var status in t.item.statuses) {
    var opt = t.item.statuses[status];
    html +=  "<option value='"+status+"'"+(item.opts.status === status ? " selected='selected'" : "")+">"+opt.label+"</option>";
  }
  form.status.innerHTML = html + form.status.innerHTML;
  var html = '';
  for(var i in t.bucket.all) {
    var bucket = t.bucket.all[i];
    html +=  "<option value='"+bucket.id+"'"+(bucket.id === bucket_id ? " selected='selected'" : "")+">"+bucket.opts.name+"</option>";
  }
  form.bucket_id.innerHTML = html + form.bucket_id.innerHTML;

}
