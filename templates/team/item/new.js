function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'status', 'bucket_id', 'plan_id', 'member_id']);
    t.model.item.create(data).then(function(item){
      t.view.updateSideNav();
      t.gotoUrl(item.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be created", "Please try again");
    });
  });
  var html = '';

  t.model.item.statuses.forEach(function(opt) {
    html +=  "<option value='"+opt.key+"'>"+opt.label+"</option>";
  });
  form.status.innerHTML = html + form.status.innerHTML;

  var html = '';
  t.model.plan.all.forEach(function(plan) {
    html +=  "<option value='"+plan.id+"'>"+plan.opts.name+"</option>";
  });
  form.plan_id.innerHTML = html + form.plan_id.innerHTML;
  form.plan_id.value = form.dataset.plan_id ? form.dataset.plan_id : "";

  var html = '';
  t.model.bucket.all.forEach(function(o) {
    html +=  "<option value='"+o.id+"'>"+o.opts.name+"</option>";
  });
  form.bucket_id.innerHTML = html + form.bucket_id.innerHTML;
  form.bucket_id.value = form.dataset.bucket_id ? form.dataset.bucket_id : "";

  var html = '';
  t.model.member.all.forEach(function(o) {
    html +=  "<option value='"+o.id+"'>"+o.opts.name+"</option>";
  });
  form.member_id.innerHTML = html + form.member_id.innerHTML;
  form.member_id.value = form.dataset.member_id ? form.dataset.member_id : "";

}
