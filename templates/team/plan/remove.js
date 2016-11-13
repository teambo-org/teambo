function(t){
  "use strict";

  var form = new t.form(document.plan_remove);
  form.addEventListener("submit", function(e) {
    form.disable();
    var id = form.id.value;
    t.model.plan.get(id).remove().then(function(){
      t.view.updateSideNav();
      t.gotoUrl(t.team.current.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Plan could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
