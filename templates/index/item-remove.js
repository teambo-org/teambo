(function(t){
    "use strict";

    var form = new t.form(document.item_remove);
    form.addEventListener("submit", function(e) {
        form.disable();
        var id = form.id.value;
        var bucket_id = form.bucket_id.value;
        t.team.item.remove(bucket_id, id).then(function(){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id+'/'+bucket_id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Item could not be removed.", "Please try again");
        });
    });

})(Teambo);
