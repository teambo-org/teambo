function(t){
  "use strict";

  t.view.progress('#main .progress');

  var form = new t.form(document.search);
  form.addEventListener("submit", function(e) {
    t.app.gotoUrl(t.team.current.url() + "/search?q=" + encodeURIComponent(form.q.value));
  });

  t.view.on('team-updated', function(e) {
    if(e.id == t.team.current.id) {
      t.app.refresh({silent: true});
    }
  });

  t.view.on(['plan-removed', 'plan-updated'], function(e) {
    t.app.refresh({silent: true});
  });

  t.view.on(['item-removed', 'item-updated'], function(e) {
    t.app.refresh({silent: true});
  });

  t.view.on(['member-removed', 'member-updated'], function(e) {
    t.app.refresh({silent: true});
  });

  t.view.on(['wiki-removed', 'wiki-updated'], function(e) {
    t.app.refresh({silent: true});
  });

}
