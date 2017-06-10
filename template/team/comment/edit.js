function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.comment_edit),
    comment_id = form.comment_id.value,
    comment = t.model.comment.get(comment_id);
  // form.text.focus();
  form.addEventListener("submit", function(e) {
    if(!comment.editable()) {
      form.error.msg("Not allowed", "Only the comment owner may edit this comment");
      return;
    }
    form.disable();
    var data = form.values(['text']);
    var submit = function() {
      comment.update(data, true).then(function(comment){
        t.app.gotoUrl(comment.parentModel().url());
      }).catch(function(xhr){
        form.enable();
        form.error.msg("Comment could not be saved", "Please try again");
      });
    };
    submit();
  });

}
