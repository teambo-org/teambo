function(t){
  "use strict";

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
