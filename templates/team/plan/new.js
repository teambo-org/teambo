function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.plan_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description', 'start', 'end']);
    t.model.plan.create(data).then(function(plan){
      t.view.updateSideNav();
      t.gotoUrl(plan.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Plan could not be created", "Please try again");
    });
  });
  
  t.view.calendar.init('plan_start');
  t.view.calendar.init('plan_end');

}
