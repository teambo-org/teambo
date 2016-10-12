(function(t){
    "use strict";

    t.editing(true);

    var form = new t.form(document.item_edit),
        bucket_id = form.dataset.bucket_id,
        item_id = form.dataset.item_id,
        item = t.team.current.buckets[bucket_id].items[item_id];
    form.name.focus();
    form.addEventListener("submit", function(e) {
        form.disable();
        var data = {
            name: form.name.value,
            description: form.description.value,
            status: form.status.value
        };
        t.team.item.update(bucket_id, item_id, data).then(function(item){
            document.getElementById('right').innerHTML = t.view.render('dashboard/right');
            t.gotoUrl('/'+t.team.current.id+'/'+bucket_id+'/'+item.id);
        }).catch(function(e){
            form.enable();
            form.error.msg("Item could not be created", "Please try again");
        });
    });
    var html = '';
    for(var status in t.team.item.statuses) {
        var opt = t.team.item.statuses[status];
        html +=  "<option value='"+status+"'"+(item.opts.status === status ? " selected='selected'" : "")+">"+opt.label+"</option>";
    }
    form.status.innerHTML = html + form.status.innerHTML;

})(Teambo);
