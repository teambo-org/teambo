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
        t.deleteByProperty(t.acct.current.teams, 'id', t.team.current.id);
        t.acct.current.save().then(function(){
          t.gotoUrl('/account');
        });
      }).catch(function(e){
        console.log(e);
        form.enable();
        form.error.msg("Member could not be removed.", "Please try again");
      });
    }
  });
  document.getElementById('delete_submit').focus();

}
