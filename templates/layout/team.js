function(t){
  "use strict";

  if(!t.acct.current.member()) {
    t.app.gotoUrl('/team-inaccessible?team_id='+t.team.current.id);
  }

  t.view.updateTheme();
  t.view.updateSideNav();
  t.view.updateStatus();

  t.chat.init({
    autoclose: document.getElementById('chat').getAttribute('data-autoclose') === "true"
  });

}
