function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.plan_edit),
    plan_id = form.dataset.plan_id,
    plan = t.model.plan.get(plan_id);
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'desc', 'start', 'end']);
    plan.update(data, true).then(function(plan){
      t.view.updateSideNav();
      t.app.gotoUrl(plan.url());
    }).catch(function(xhr){
      form.enable();
      form.error.msg("Plan could not be saved", "Please try again");
    });
  });

  t.view.calendar.init('plan_start');
  t.view.calendar.init('plan_end');

}
