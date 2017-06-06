function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.item_edit),
    item_id = form.dataset.item_id,
    item = t.model.item.get(item_id);
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.object.extend(item.opts, data);
    var submit = function() {
      item.update(data, true).then(function(item){
        t.view.updateSideNav();
        t.app.gotoUrl(item.url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Item could not be saved", "Please try again");
      });
    };
    submit();
  });

  var el = document.getElementById('item-opts');
  var callback = function(){
    el.innerHTML = t.view.renderTemplate('team/item/_sidenav', item);
    t.view.autoselect.init('#item-opts .autoselect', item, callback);
  };
  t.view.autoselect.init('#item-opts .autoselect', item, callback);

}
