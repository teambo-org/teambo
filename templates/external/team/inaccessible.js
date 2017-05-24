function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.remove_team);
  var team_id = form.dataset.team_id;

  if(!team_id || !t.acct.current.hasTeam(team_id)) {
    t.app.gotoUrl('/account');
  }

  form.addEventListener("submit", function(e) {
    form.disable();
    var hard_confirm = "Are you sure you wish to remove this team? You are the admin which " +
      "means that if you remove this team from your account, there may be nobody left " +
      "to administer the team."
    if(!team.admin || confirm(hard_confirm)) {
      t.acct.current.removeTeam({id: team_id}).then(function() {
        t.app.gotoUrl('/account');
      }).catch(function(e){
        form.enable();
        form.error.msg("Team could not be fully removed", "Please try again when you are online");
      });
    }
  });

}
