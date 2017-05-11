function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.remove_team);
  var team_id = form.dataset.team_id;

  if(!team_id) {
    t.gotoUrl('/account');
  }

  form.addEventListener("submit", function(e) {
    form.disable();
    t.deleteByProperty(t.acct.current.teams, 'id', team_id);
    t.acct.current.save().then(function() {
      t.gotoUrl('/account');
    }).catch(function(e){
      form.enable();
      form.error.msg("Team could not be remove", "Please try again when you are online");
    });;
  });

}
