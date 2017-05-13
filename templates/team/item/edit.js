function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.item_edit),
    item_id = form.dataset.item_id,
    item = t.model.item.get(item_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'status', 'bucket_id', 'plan_id', 'member_id']);
    var submit = function() {
      item.update(data, true).then(function(item){
        t.view.updateSideNav();
        t.app.gotoUrl(item.url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Item could not be saved", "Please try again");
      });
    };
    submit();
  });

  t.model.item.statuses.forEach(function(opt) {
    html +=  "<option value='"+opt.key+"'>"+opt.label+"</option>";
  });
  form.status.innerHTML = html + form.status.innerHTML;
  form.status.value = item.opts.status ? item.opts.status : "";

  var html = '';
  t.model.plan.all.forEach(function(plan) {
    html +=  "<option value='"+plan.id+"'>"+plan.opts.name+"</option>";
  });
  form.plan_id.innerHTML = html + form.plan_id.innerHTML;
  form.plan_id.value = item.opts.plan_id ? item.opts.plan_id : "";

  var html = '';
  t.model.bucket.all.forEach(function(o) {
    html +=  "<option value='"+o.id+"'>"+o.opts.name+"</option>";
  });
  form.bucket_id.innerHTML = html + form.bucket_id.innerHTML;
  form.bucket_id.value = item.opts.bucket_id ? item.opts.bucket_id : "";

  var html = '';
  t.model.member.all.forEach(function(o) {
    html +=  "<option value='"+o.id+"'>"+o.opts.name+"</option>";
  });
  form.member_id.innerHTML = html + form.member_id.innerHTML;
  form.member_id.value = item.opts.member_id ? item.opts.member_id : "";

}
