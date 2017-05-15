function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.search);
  var q = form.dataset.q;
  var results_el = document.getElementById('search-results')

  form.q.focus();
  form.addEventListener("submit", function(e) {
    t.app.gotoUrl(t.team.current.url() + "/search?q=" + encodeURIComponent(form.q.value));
  });

  if(q) {
    form.disable();
    var result = t.model.searchAll(q);
    console.log(result);
    results_el.innerHTML = t.view.renderTemplate('team/search/_results', {result: result});
    form.enable();
  }
}
