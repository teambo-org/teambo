(function(t){
    "use strict";

    var form = new t.form(document.team_edit),
        team_id = form.dataset.team_id;
    form.name.focus();
    form.addEventListener("submit", function(e) {
        form.disable();
        var data = {
            name: form.name.value
        };
        t.team.current.update(data).then(function(team){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Team changes could not be saved", "Please try again");
        });
    });

})(Teambo);
