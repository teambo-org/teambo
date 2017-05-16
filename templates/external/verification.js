function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.verification);
  var email = form.getAttribute('data-email');
  var pass  = form.getAttribute('data-pass');
  form.verify_pass.focus();

  form.addEventListener('submit', function(e){
    var verify_pass  = form.verify_pass.value;
    if(verify_pass !== pass) {
      form.error.msg('Password does not match', 'Please confirm the password you entered on the previous screen or return to the last step');
      form.verify_pass.focus();
      return;
    }
    t.acct.verification.send(email, pass).then(function(xhr) {
      form.disable();
      if(xhr.status == 201) {
        t.app.replaceUrl('/verification-sent', {email: email});
      } else {
        form.enable();
        form.error.msg('Verification could not be sent');
      }
    }).catch(function(e){
      form.error.msg('Verification could not be sent', 'please try again');
    });
  });

}
