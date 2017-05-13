function(t){
  "use strict";

  var form = new t.form(document.team_remove);
  var team = t.team.current;
  form.addEventListener("submit", function(e) {
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
      team.remove(data.name).then(function(){
        t.app.gotoUrl('/account');
      }).catch(function(e){
        form.enable();
        form.error.msg("Team could not be deleted.", "Please try again");
      });
    } else {
      form.enable();
    }
  });
  document.getElementById('team_name').focus();

}
