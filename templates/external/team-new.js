var form = new t.form(document.team_new);
form.name.focus();
form.addEventListener("submit", function(e) {
    form.disable();
    var name = form.name.value;
    t.team.create(name).then(function(team){
        console.log(team);
        t.gotoUrl('#/'+team.hash.substr(0,8));
    }).catch(function(e){
        form.enable();
        form.error.msg("Team could not be created", "Please try again");
    });
});