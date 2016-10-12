(function(t){
    "use strict";

    t.editing(true);

    var form = new t.form(document.team_edit),
        team_id = form.dataset.team_id;
    form.name.focus();
    form.addEventListener("submit", function(e) {
        form.disable();
        var data = {
            name: form.name.value,
            theme: form.theme.value
        };
        t.team.current.update(data).then(function(team){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Team changes could not be saved", "Please try again");
        });
    });

    var html = '';
    for(var theme in t.themes) {
        html +=  "<option value='"+theme+"'"+(t.team.current.opts.theme === theme ? " selected='selected'" : "")+">"+theme+"</option>";
    }
    form.theme.innerHTML = html + form.theme.innerHTML;
    form.theme.addEventListener("change", function(e) {
        t.view.updateTheme(form.theme.value);
    });
    t.nextNav(function() {
        t.view.updateTheme();
    });

})(Teambo);
