function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.invite_respond);
  var data = {
    ikey:  form.getAttribute('data-ikey'),
    chk:   form.getAttribute('data-chk'),
    name:  form.getAttribute('data-name')
  };

  if(!t.acct.isAuthed()) {
    if(data.ikey) {
      localforage.setItem('ikey-data', data);
    }
    t.app.gotoUrl('/login');
  } else if(!data.ikey) {
    form.disable();
    localforage.getItem('ikey-data').then(function(d) {
      if(d && d.ikey) {
        data = d;
      }
      form.enable();
    });
  }

  form.addEventListener('submit', function(e){
    localforage.removeItem('ikey-data')
    form.disable();
    t.model.invite.respond(data).then(function(xhr) {
      if(xhr.status == 201) {
        var invite = new t.model.invite(data);
        t.acct.current.invites.push(invite);
        t.acct.current.save().then(function() {
          t.app.replaceUrl('/invite-responded');
        });
      } else {
        form.enable();
        var d = JSON.parse(xhr.responseText);
        form.error.msg(d.error);
      }
    }).catch(function(xhr){
      if(xhr.status == 403) {
        form.error.msg("Email Address does not match", "Are you logged into the correct account?");
      } else if(xhr.status == 404) {
        localforage.removeItem('ikey-data');
        t.app.gotoUrl('/account')
      } else {
        form.enable();
        var d = JSON.parse(xhr.responseText);
        form.error.msg(d.error);
      }
    });
  });

}
