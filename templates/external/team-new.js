function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.team_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var name = form.name.value;
    t.team.create(name).then(function(team){
      t.app.gotoUrl('/'+team.id);
    }).catch(function(e){
      form.enable();
      form.error.msg("Team could not be created", "Please try again");
    });
  });

}
