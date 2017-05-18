function(t){
  "use strict";

  t.app.editing = true;

  var item = new t.model.item({});
  item.opts.status = 'ready';

  var form = new t.form(document.item_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.object.extend(data, item.opts);
    t.model.item.create(data).then(function(item){
      t.view.updateSideNav();
      t.app.gotoUrl(item.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Item could not be created", "Please try again");
    });
  });
  var html = '';

  var el = document.getElementById('item-opts');
  var callback = function(opt, val){
    item.opts[opt] = val;
    el.innerHTML = t.view.renderTemplate('team/item/_sidenav', item);
    t.view.autoselect.init('#item-opts .autoselect', item, callback, opt);
  };
  t.view.autoselect.init('#item-opts .autoselect', item, callback);

}
