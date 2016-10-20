(function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_edit),
    bucket_id = form.dataset.bucket_id,
    item_id = form.dataset.item_id,
    item = t.item.get(item_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = {
      name: form.name.value,
      description: form.description.value,
      status: form.status.value,
      bucket_id: form.bucket.value
    };
    t.item.update(item_id, data).then(function(item){
      t.updateRightNav();
      t.gotoUrl('/'+t.team.current.id+'/'+item.opts.bucket_id+'/'+item_id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be created", "Please try again");
    });
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
  form.bucket.innerHTML = html + form.bucket.innerHTML;

})(Teambo);
