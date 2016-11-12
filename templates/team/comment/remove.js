function(t){
  "use strict";

  var form = new t.form(document.remove);
  var comment_id = form.comment_id.value;
  var comment = t.model.comment.get(comment_id);
  var parentModel = comment.parentModel();
  form.addEventListener("submit", function(e) {
    form.disable();
    comment.remove().then(function(){
      t.gotoUrl(parentModel.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Comment could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
