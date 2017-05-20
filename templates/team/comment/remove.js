function(t){
  "use strict";

  var form = new t.form(document.comment_remove);
  var comment_id = form.comment_id.value;
  var comment = t.model.comment.get(comment_id);
  var parentModel = comment.parentModel();
  form.addEventListener("submit", function(e) {
    if(!comment.editable()) {
      form.error.msg("Not allowed", "Only the comment owner may remove this comment");
      return;
    }
    form.disable();
    comment.remove().then(function(){
      t.app.gotoUrl(parentModel.url());
    }).catch(function(e){
      form.enable();
      form.error.msg("Comment could not be removed.", "Please try again");
    });
  });
  document.getElementById('delete_submit').focus();

}
