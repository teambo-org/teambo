(function(t){
    "use strict";

    var form = new t.form(document.bucket_edit),
        bucket_id = form.dataset.bucket_id;
    form.name.focus();
    form.addEventListener("submit", function(e) {
        form.disable();
        var data = {
            name: form.name.value
        };
        t.team.bucket.update(bucket_id, data).then(function(bucket){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id+'/'+bucket.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Bucket changes could not be saved", "Please try again");
        });
    });

})(Teambo);
