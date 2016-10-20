(function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_new),
    bucket_id = form.dataset.bucket_id;
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = {
      name: form.name.value,
      description: form.description.value,
      status: form.status.value,
      bucket_id: bucket_id
    };
    t.item.create(data).then(function(item){
      t.updateRightNav();
      t.gotoUrl('/'+t.team.current.id+'/'+bucket_id+'/'+item.id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be created", "Please try again");
    });
  });
  var html = '';
  for(var status in t.item.statuses) {
    var opt = t.item.statuses[status];
    html +=  "<option value='"+status+"'>"+opt.label+"</option>";
  }
  form.status.innerHTML = html + form.status.innerHTML;

})(Teambo);
