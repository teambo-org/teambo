function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.wiki_new);
  form.title.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['title', 'text', 'parid']);
    t.model.wiki.create(data).then(function(wiki){
      t.view.updateSideNav();
      t.gotoUrl(wiki.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Wiki page could not be created", "Please try again");
    });
  });

}
