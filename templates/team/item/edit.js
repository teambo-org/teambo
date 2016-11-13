function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_edit),
    item_id = form.dataset.item_id,
    item = t.model.item.get(item_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'status', 'bucket_id']);
    var submit = function() {
      item.update(data, true).then(function(item){
        t.view.updateSideNav();
        t.gotoUrl(item.url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Item could not be saved", "Please try again");
      });
    };
    submit();
  });
  var html = '';
  t.model.item.statuses.forEach(function(opt) {
    html +=  "<option value='"+opt.key+"'"+(item.opts.status === opt.key ? " selected='selected'" : "")+">"+opt.label+"</option>";
  });
  form.status.innerHTML = html + form.status.innerHTML;
  var html = '';
  var buckets = t.model.bucket.all.concat([t.model.bucket.orphaned]);
  for(var i in buckets) {
    var bucket = buckets[i];
    html +=  "<option value='"+bucket.id+"'"+(bucket.id === t.model.bucket.current.id ? " selected='selected'" : "")+">"+bucket.opts.name+"</option>";
  }
  form.bucket_id.innerHTML = html + form.bucket_id.innerHTML;
}
