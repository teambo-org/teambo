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
      window.sessionStorage.setItem('ikey-data', JSON.stringify(data));
    }
    t.app.gotoUrl('/login', {ikey: data.ikey});
  } else if(!data.ikey) {
    var d = window.sessionStorage.getItem('ikey-data');
    var d = d ? JSON.parse(d) : {};
    if(d && d.ikey) {
      data = d;
    }
  }

  var decline = document.getElementById('decline');
  if(decline) {
    decline.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.sessionStorage.removeItem('ikey-data');
      t.app.gotoUrl('/account');
    });
  }

  form.addEventListener('submit', function(e){
    window.sessionStorage.removeItem('ikey-data');
    form.disable();
    t.model.invite.respond(data).then(function(xhr) {
      if(xhr.status == 201) {
        var invite = new t.model.invite(data);
        t.acct.current.invites.push(invite);
        t.acct.current.save().then(function() {
          t.app.replaceUrl('/invite/responded');
        });
      } else {
        form.enable();
        var d = JSON.parse(xhr.responseText);
        form.error.msg(d.error);
      }
    }).catch(function(xhr){
      if(xhr.status == 403) {
        form.error.msg("Email Address does not match", "Log in using the correct email address<br>to accept this invite");
      } else if(xhr.status == 404) {
        t.app.gotoUrl('/account')
      } else {
        form.enable();
        if(xhr.responseText) {
          var d = JSON.parse(xhr.responseText);
          form.error.msg(d.error);
        } else {
          t.app.trace(xhr);
          form.error.msg("Unknown Error", "Please try again");
        }
      }
    });
  });

}
