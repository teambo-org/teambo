function(t){
  "use strict";

  if(!t.acct.current.rsa) {
    t.gotoUrl('/keygen');
    return;
  }

  t.editing(true);

  t.event.once('pre-nav', function() {
    t.socket.acct.stop();
  });
  t.socket.acct.on('updated', function() {
    t.gotoUrl('/account', true);
  });
  t.socket.acct.on('removed', function() {
    t.acct.deAuth();
    t.gotoUrl('/login');
  });
  t.socket.acct.on('checked', function() {
    t.socket.inviteAcceptance.on('activated', function() {
      t.gotoUrl('/account', true);
    });
    t.socket.inviteAcceptance.start();
  });
  t.socket.acct.start();

  var el = document.getElementById('teams');
  t.team.findAll().then(function(teams) {
    var html = '';
    teams.forEach(function(team) {
      html += t.view.renderTemplate('external/_team-li', team);
    });
    t.acct.current.invites.forEach(function(invite) {
      html += t.view.renderTemplate('external/_invite-li', invite);
    });
    el.innerHTML = el.innerHTML + html;
    var theme_styles = t.view.renderTemplate('external/account-themes', {teams: teams, default_theme: t.themes["Default"]}),
      url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
    document.getElementById('account-themes').href = "data:text/css;base64,"+url;

    var anchors = el.querySelectorAll('a');
    var disabled = false;
    [].forEach.call(anchors, function(el) {
      el.addEventListener('click', function(e) {
        if(disabled) {
          e.preventDefault();
        }
        disabled = true;
      });
    });
    var i = 0;
    if(anchors.length) {
      anchors[0].focus();
    }
  });

  t.view.updateStatus();

}
