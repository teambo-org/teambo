function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_edit),
    item_id = form.dataset.item_id,
    item = t.model.item.get(item_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'status', 'bucket_id', 'plan_id']);
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
    html +=  "<option value='"+opt.key+"'>"+opt.label+"</option>";
  });
  form.status.innerHTML = html + form.status.innerHTML;
  form.status.value = item.opts.status;
  
  var html = '';
  var buckets = t.model.bucket.all.concat([t.model.bucket.orphaned]);
  buckets.forEach(function(bucket) {
    html +=  "<option value='"+bucket.id+"'>"+bucket.opts.name+"</option>";
  });
  form.bucket_id.innerHTML = html + form.bucket_id.innerHTML;
  form.bucket_id.value = t.model.bucket.current.id;
  
  var html = '';
  t.model.plan.all.forEach(function(plan) {
    html +=  "<option value='"+plan.id+"'>"+plan.opts.name+"</option>";
  });
  form.plan_id.innerHTML = form.plan_id.innerHTML + html;
  form.plan_id.value = item.opts.plan_id;
}
