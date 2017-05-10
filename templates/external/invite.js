function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.invite_respond);

  form.addEventListener('submit', function(e){
    var data = {
      ikey:  form.getAttribute('data-ikey'),
      chk:   form.getAttribute('data-chk'),
      name:  form.getAttribute('data-name')
    };
    form.disable();
    t.model.invite.respond(data).then(function(xhr) {
      if(xhr.status == 201) {
        var invite = new t.model.invite(data);
        t.acct.current.invites.push(invite);
        t.acct.current.save().then(function() {
          t.replace('/invite-responded');
        });
      } else {
        form.enable();
        var d = JSON.parse(xhr.responseText);
        form.error.msg(d.error);
      }
    }).catch(function(xhr){
      if(xhr.status == 403) {
        form.error.msg("Email Address does not match", "Are you logged into the correct account?");
      } else {
        form.enable();
        var d = JSON.parse(xhr.responseText);
        form.error.msg(d.error);
      }
    });
  });

}
