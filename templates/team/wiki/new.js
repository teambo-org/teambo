function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.wiki_new);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'text', 'parent_id']);
    t.model.wiki.create(data).then(function(wiki){
      t.view.updateSideNav();
      t.gotoUrl(wiki.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Wiki page could not be created", "Please try again");
    });
  });

}
