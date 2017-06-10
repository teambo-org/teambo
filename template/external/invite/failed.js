function(t){
  "use strict";

  var form = new t.form(document.remove_invite);
  var ikey = form.dataset.ikey;

  form.addEventListener("submit", function(e) {
    form.disable();
    t.array.deleteByProperty(t.acct.current.invites, 'ikey', ikey);
    t.acct.current.save().then(function() {
      t.app.gotoUrl('/account');
    }).catch(function(e){
      form.enable();
      form.error.msg("Invite could not be removed", "Please try again when you are online");
    });
  });

}
