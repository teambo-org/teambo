function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.team_edit);
  var team_id = form.dataset.team_id;
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'theme']);
    var submit = function() {
      t.team.current.update(data, true).then(function(team){
        t.view.updateSideNav();
        t.app.gotoUrl('/'+t.team.current.id);
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Team changes could not be saved", "Please try again");
      });
    };
    submit();
  });

  var html = '';
  for(var theme in t.themes) {
    html +=  "<option value='"+theme+"'"+(t.team.current.opts.theme === theme ? " selected='selected'" : "")+">"+theme+"</option>";
  }
  form.theme.innerHTML = html + form.theme.innerHTML;
  form.theme.addEventListener("change", function(e) {
    t.view.updateTheme(form.theme.value);
  });
  t.event.once('pre-nav', function() {
    t.view.updateTheme();
  });

}
