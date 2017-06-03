function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.team_new);
  form.team_name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var name = form.team_name.value;
    t.team.create(name).then(function(team){
      t.app.gotoUrl('/'+team.id);
    }).catch(function(e){
      form.enable();
      if(typeof e === "string") {
        form.error.msg(e);
      } else {
        t.app.trace(e);
        form.error.msg("Team could not be created", "Please try again");
      }
    });
  });

}
