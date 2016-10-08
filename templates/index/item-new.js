(function(t){
    "use strict";
    
    var form = new t.form(document.item_new),
        bucket_id = form.dataset.bucket_id;
    form.name.focus();
    form.addEventListener("submit", function(e) {
        form.disable();
        var name = form.name.value;
        t.team.item.create(bucket_id, name).then(function(item){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id+'/'+bucket_id+'/'+item.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Item could not be created", "Please try again");
        });
    });

})(Teambo);
