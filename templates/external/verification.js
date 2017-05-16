function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.verification);
  var email = form.getAttribute('data-email');
  var pass  = form.getAttribute('data-pass');
  form.verify_pass.focus();

  form.addEventListener('submit', function(e){
    var verify_pass  = form.verify_pass.value;
    var beta  = form.beta.value;
    if(verify_pass !== pass) {
      form.error.msg('Password does not match', 'Please confirm the password you entered on the previous screen or return to the last step');
      form.verify_pass.focus();
      return;
    }
    if(!beta) {
      form.error.msg('Beta Code Required', 'This application is in beta<br/>A beta code is required in order to create an account');
      form.verify_pass.focus();
      return;
    }
    t.acct.verification.send(email, pass, false, beta).then(function(xhr) {
      form.disable();
      if(xhr.status == 201) {
        t.app.replaceUrl('/verification-sent', {email: email});
      } else {
        form.enable();
        form.error.msg('Verification could not be sent');
      }
    }).catch(function(xhr){
      if(xhr.status == 403) {
        form.enable();
        form.error.msg('Invalid Beta Code', "Ask around<br/>I'm sure someone you know can find one");
        form.beta.focus();
      } else {
        form.enable();
        form.error.msg('Verification could not be sent', 'please try again');
      }
    });
  });

}
