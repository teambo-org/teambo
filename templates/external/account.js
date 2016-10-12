(function(t){
    "use strict";

    t.editing(true);

    var el = document.getElementById('teams');
    t.acct.current.team.all().then(function(teams) {
        if(!teams.length) {
            return;
        }
        var html = '';
        teams.forEach(function(team) {
            html += t.view.render('external/_team-li', team);
        });
        el.innerHTML = html + el.innerHTML;
        var theme_styles = t.view.render('external/account-themes', {teams: teams}),
            url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
        document.getElementById('account-themes').href = "data:text/css;base64,"+url;

        var anchors = el.querySelectorAll('a');
        var i = 0;
        anchors[i].focus();
    });
    el.addEventListener('click', function(e) {
        if(e.target.nodeName == 'A' || e.target.parentNode.nodeName == 'A') {
            document.getElementById('logo').classList.add('spinner');
        }
    });

})(Teambo);
