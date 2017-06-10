function(t){
  "use strict";

  var form = new t.form(document.remove);
  var member_id = form.member_id.value;
  var member = t.model.member.get(member_id);
  form.addEventListener("submit", function(e) {
    if(!member.canRemove()) {
      form.error.msg("Not allowed", "Only an admin may remove this member");
      return;
    }
    form.disable();
    member.remove().then(function(){
      t.view.updateSideNav();
      t.app.gotoUrl(t.team.current.url() + '/members');
    }).catch(function(e){
      form.enable();
      form.error.msg("Member could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
