function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'status', 'bucket_id']);
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

}
