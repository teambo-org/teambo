(function(t){
    "use strict";

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
        var data = {
            team: {
                theme: function(){ return t.themes[form.theme.value]; }
            }
        };
        var theme_styles = t.view.render('dashboard/theme', {}, data);
        var url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
        document.getElementById('theme').href = "data:text/css;base64,"+url;
    });
    t.nextNav(function() {
        var theme_styles = t.view.render('dashboard/theme');
        var url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
        document.getElementById('theme').href = "data:text/css;base64,"+url;
    });

})(Teambo);
