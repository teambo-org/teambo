function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.unlock);

  var id = form.dataset.id;
  var rkey = form.dataset.rkey;

  if(id && rkey) {
    form.style.display = 'none';
    t.xhr.post('/acct/unlock', {data: {id: id, rkey: rkey}}).then(function(xhr) {
      if(xhr.status === 200) {
        t.app.gotoUrl('/account/unlock-success');
      } else if(xhr.status === 404) {
        form.style.display = 'block';
        form.error.msg('Reset code not found', 'The reset code you supplied is no longer valid<br>Please try again');
      } else {
        form.style.display = 'block';
        form.enable();
        form.error.msg('Unknown Error', 'Please try again');
      }
    }).catch(function(e) {
      form.style.display = 'block';
      form.enable();
      form.error.msg('Unknown Error', 'Please try again');
    });
  }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    form.error.hide();
    var email = form.email.value;
    form.disable();
    t.xhr.post('/acct/unlock', {data: {email: email}}).then(function(xhr) {
      if(xhr.status === 201) {
        t.app.gotoUrl('/account/unlock-sent', {email: email});
      } else if(xhr.status == 409) {
        form.error.msg('Reset code already sent', 'Please check your email and click the link');
      } else if(xhr.status == 403) {
        form.error.msg('Reset limit has been reached', 'You have already reset your account<br>Account locks reset automatically after 24 hours');
      } else {
        form.enable();
        form.error.msg('Unknown Error', 'Account unlock failed, please try again.');
      }
    }).catch(function(e) {
      form.enable();
      form.error.msg('Unknown Error', 'Account unlock failed, please try again.');
    });
  });
  form.email.focus();
  form.email.oninput = form.error.hide;
}
