(function(t){
    "use strict";

    var form = new t.form(document.bucket_remove);
    form.addEventListener("submit", function(e) {
        form.disable();
        var id = form.id.value;
        t.team.bucket.remove(id).then(function(){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Bucket could not be removed.", "Please try again");
        });
    });
    document.getElementById('delete_submit').focus();

})(Teambo);
