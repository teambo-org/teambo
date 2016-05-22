(function(t){
    "use strict";
    
    var el = t.id('teams');
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
        t.id('account-themes').href = "data:text/css;base64,"+url;
        
        var anchors = el.querySelectorAll('a');
        var i = 0;
        anchors[i].focus();
        el.addEventListener("keydown", function(e) {
            if(event.keyIdentifier == "Down") {
                i++;
                i = i >= anchors.length ? 0 : i;
                anchors[i].focus();
                e.preventDefault();
            } else if (event.keyIdentifier == "Up") {
                i--;
                i = i < 0 ? anchors.length-1 : i;
                anchors[i].focus();
                e.preventDefault();
            }
        }, false);

    });

})(Teambo);
