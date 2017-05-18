function(t){
  "use strict";

  t.app.editing = true;

  var item = new t.model.item({opts:{
    status:   'ready',
    plan_id:   t.model.plan.current   ? t.model.plan.current.id   : null,
    folder_id: t.model.folder.current ? t.model.folder.current.id : null,
    member_id: t.model.member.current ? t.model.member.current.id : null
  }});
  t.model.item.current = item;
  var current = {
    plan: t.model.plan.current,
    folder: t.model.folder.current,
    member: t.model.member.current
  };
  var resetCurrent = function() {
    Object.keys(current).forEach(function(k) {
      t.model[k].current = current[k];
    });
  };
  var unsetCurrent = function() {
    Object.keys(current).forEach(function(k) {
      t.model[k].current = null;
    });
  };

  var form = new t.form(document.item_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'description']);
    t.object.extend(data, item.opts);
    resetCurrent();
    t.model.item.create(data).then(function(item){
      t.view.updateSideNav();
      t.app.gotoUrl(item.url());
    }).catch(function(e){
      unsetCurrent();
      form.enable();
      form.error.msg("Item could not be created", "Please try again");
    });
  });
  var html = '';

  var el = document.getElementById('item-opts');
  var callback = function(opt, val){
    if(opt) {
      item.opts[opt] = val;
    }
    el.innerHTML = t.view.renderTemplate('team/item/_sidenav', item);
    t.view.autoselect.init('#item-opts .autoselect', item, callback, opt);
  };
  callback();

  unsetCurrent();
}
