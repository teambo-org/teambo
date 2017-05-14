function(t){
  "use strict";

  if(!t.acct.current.member()) {
    t.app.gotoUrl('/team-inaccessible?team_id='+t.team.current.id);
  }

  t.view.updateTheme();
  t.view.updateSideNav();
  t.view.updateStatus();
  t.socket.team.start();
  if(t.team.current.isAdmin()) {
    t.socket.inviteResponse.start();
  }

  t.chat.init({
    autoclose: document.getElementById('chat').getAttribute('data-autoclose') === "true"
  });

}
