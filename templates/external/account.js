var el = t.id('teams');
t.acct.team.all().then(function(teams) {
    if(!teams.length) {
        return;
    }
    var html = '';
    teams.forEach(function(team) {
        html += t.render('external/_team-li', team);
    });
    el.innerHTML = html + el.innerHTML;
    var test = function(data) {
        t.log(data);
    }
    
});