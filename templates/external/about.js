function(t){
  "use strict";

  t.app.log('Howdy, Stranger.');

  var theme = "Ocean Blue";

  t.view.updateTheme(theme);

  t.view.autoselect.init('#dashboard.item .autoselect', t.model.item.current);

  var el = window.document.getElementById('team_theme');
  var html = '';
  for(var theme_name in t.themes) {
    html +=  "<option value='"+theme_name+"'"+(theme === theme_name ? " selected='selected'" : "")+">"+theme_name+"</option>";
  }
  el.innerHTML = html;
  el.addEventListener("change", function(e) {
    theme = el.value;
    t.view.updateTheme(theme);
  });

}
