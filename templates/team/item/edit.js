function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.item_edit),
    item_id = form.dataset.item_id,
    item = t.model.item.get(item_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    var submit = function() {
      item.update(data, true).then(function(item){
        t.view.updateSideNav();
        t.gotoUrl(item.url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Item could not be saved", "Please try again");
      });
    };
    submit();
  });

}
