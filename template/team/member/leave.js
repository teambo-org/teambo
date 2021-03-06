function(t){
  "use strict";

  var form = new t.form(document.remove);
  var member_id = form.member_id.value;
  var member = t.model.member.get(member_id);
  form.addEventListener("submit", function(e) {
    if(!member.canLeave()) {
      form.error.msg("Not allowed", "Only non-admins may leave a team");
      return;
    }
    form.disable();
    if(confirm('Are you sure you want to leave this team? You will need to be reinvited to join it again.')) {
      member.remove().then(function(){
        t.acct.current.removeTeam(t.team.current).then(function(){
          t.app.gotoUrl('/account');
        });
      }).catch(function(e){
        form.enable();
        form.error.msg("Member could not be removed.", "Please try again");
      });
    }
  });
  document.getElementById('delete_submit').focus();

}
