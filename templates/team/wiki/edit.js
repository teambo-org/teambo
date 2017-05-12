function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.wiki_edit),
    wiki_id = form.dataset.wiki_id,
    wiki = t.model.wiki.get(wiki_id);
  form.name.focus();
  form.addEventListener("submit", function(e) {
    form.disable();
    var data = form.values(['name', 'text']);
    var submit = function() {
      wiki.update(data, true).then(function(wiki){
        t.view.updateSideNav();
        t.gotoUrl(wiki.url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Wiki could not be saved", "Please try again");
      });
    };
    submit();
  });

}
