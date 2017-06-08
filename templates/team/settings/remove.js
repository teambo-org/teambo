function(t){
  "use strict";

  var form = new t.form(document.team_remove);
  var team = t.team.current;
  form.addEventListener("submit", function(e) {
    var cur_pass = form.cur_pass.value;
    if(!t.app.online) {
      form.error.msg("You are not online", "Teams can only be removed while online");
      return;
    }
    var data = form.values(['name']);
    if(data.name != team.opts.name) {
      form.error.msg("Team name does not match", "Please enter the name of this team <br> to confirm that you want to delete it");
      return;
    }
    form.disable();
    if(confirm("Are you sure you wish to delete this team? This cannot be undone.")) {
      team.remove(data.name, cur_pass).then(function(){
        t.acct.current.removeTeam(team).then(function() {
          t.app.gotoUrl('/account');
        });
      }).catch(function(e){
        form.enable();
        if(e.status && e.status === 403) {
          var d = JSON.parse(e.responseText);
          form.error.msg(d.error);
        } else {
          form.error.msg("Team could not be deleted.", "Please try again");
        }
      });
    } else {
      form.enable();
    }
  });
  document.getElementById('team_name').focus();

}
