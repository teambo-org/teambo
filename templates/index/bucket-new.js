(function(t){
    "use strict";

    var form = new t.form(document.bucket_new);
    form.name.focus();
    form.addEventListener("submit", function(e) {
        form.disable();
        var name = form.name.value;
        t.team.bucket.create(name).then(function(bucket){
            t.gotoUrl('/'+t.team.current.id+'/'+bucket.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Bucket could not be created", "Please try again");
        });
    });

})(Teambo);
