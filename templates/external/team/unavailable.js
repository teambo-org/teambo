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
    t.acct.current.removeTeam({id: team_id}).then(function() {
      t.app.gotoUrl('/account');
    }).catch(function(e){
      form.enable();
      form.error.msg("Team could not be remove", "Please try again when you are online");
    });
  });

}
