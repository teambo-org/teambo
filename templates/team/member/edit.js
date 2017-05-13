function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.member_edit),
    member_id = form.dataset.member_id,
    member = t.model.member.get(member_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    if(!member.editable()) {
      form.error.msg("Not allowed", "Members may only edit their own profiles");
      return;
    }
    var data = form.values(['name', 'description', 'icon']);
    form.disable();
    member.update(data, true).then(function(member){
      t.view.updateSideNav();
      t.app.gotoUrl(member.url());
    }).catch(function(xhr){
      form.enable();
      form.error.msg("member could not be saved", "Please try again");
    });
  });
  form.icon.value = form.icon.dataset.value;

}
