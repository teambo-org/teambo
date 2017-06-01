function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.unsubscribe);
  var data = {
    email: form.dataset.email,
    chk: form.dataset.chk
  };

  form.addEventListener('submit', function(e){
    e.preventDefault();
    form.error.hide();
    form.disable();
    t.xhr.post('/newsletter/unsubscribe', {
      data: data
    }).then(function(xhr) {
      if(xhr.status === 200) {
        t.app.gotoUrl('/newsletter/unsubscribe-success');
      } else if(xhr.status === 404) {
        form.error.msg('Subscription not found', "You may have already unsubscribed");
      } else if(xhr.status === 403) {
        form.error.msg('Invalid subscription token', "Try clicking the unsubscribe link in the email again");
      }
    }).catch(function(xhr) {
      form.enable();
      if(xhr.status === 0) {
        form.error.msg('You are offline', "You must be online to unsubscribe");
      } else {
        form.error.msg('Unknown error', "Could not unsubscribe<br>Please try again");
      }
    });
  });

  t.view.updateStatus();
}
