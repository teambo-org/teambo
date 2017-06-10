Teambo.view.comment = (function(t){
  "use strict";

  var init = function(model) {
    var form = new t.form(document.comment);
    form.addEventListener("submit", function(e) {
      form.disable();
      var data = form.values(['text', 'pid', 'ptype', 'member_id']);
      var submit = function() {
        t.model.comment.create(data).then(function(comment){
          t.app.refresh();
        }).catch(function(e){
          form.enable();
          form.error.msg("Comment could not be saved", "Please try again");
        });
      };
      submit();
    });
    form.text.addEventListener("keydown", function(e) {
      var key = e.key.toLowerCase();
      if(key === 'enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        form._submit();
      }
    });
  };

  return {
    init: init
  };

})(Teambo);
