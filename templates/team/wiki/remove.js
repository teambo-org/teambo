function(t){
  "use strict";

  var form = new t.form(document.wiki_remove);
  var wiki_id = form.wiki_id.value;
  var wiki = t.model.wiki.get(wiki_id);
  var parent = wiki.parents().pop();
  form.addEventListener("submit", function(e) {
    form.disable();
    wiki.remove().then(function(){
      t.view.updateSideNav();
      t.app.gotoUrl(parent ? parent.url() : t.team.current.url() + '/wiki');
    }).catch(function(e){
      form.enable();
      form.error.msg("Wiki page could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
