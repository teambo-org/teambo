function(t){
  "use strict";

  t.editing(true);

  var el = document.getElementById('teams');
  t.team.findAll().then(function(teams) {
    if(!teams.length) {
      return;
    }
    var html = '';
    teams.forEach(function(team) {
      html += t.view.renderTemplate('external/_team-li', team);
    });
    el.innerHTML = html + el.innerHTML;
    var theme_styles = t.view.renderTemplate('external/account-themes', {teams: teams}),
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
    anchors[0].focus();
  });

}
