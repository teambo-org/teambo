function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.team_edit),
    team_id = form.dataset.team_id;
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'theme']);
    var submit = function() {
      t.team.current.update(data).then(function(team){
        t.updateSideNav();
        t.gotoUrl('/'+t.team.current.id);
      }).catch(function(xhr){
        if(xhr.status === 409) {
          form.enable();
          var opts = t.team.current.opts;
          t.acct.current.team.refresh(t.team.current.id).then(function(new_team){
            for(var i in opts) {
              if(data[i] == opts[i]) {
                data[i] = new_team.opts[i];
              }
            }
            t.team.init(new_team.id).then(function(o){
              t.view.set('team', t.team.current);
              submit();
            });
          });
        } else {
          form.enable();
          form.error.msg("Team changes could not be saved", "Please try again");
        }
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
  t.nextNav(function() {
    t.view.updateTheme();
  });

}
