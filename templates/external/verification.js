function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.verification);
  var email = form.getAttribute('data-email');
  var pass  = form.getAttribute('data-pass');
  var ikey  = form.getAttribute('data-ikey');
  var ichk;
  form.verify_pass.focus();

  if(ikey) {
    localforage.getItem('ikey-data').then(function(d) {
      if(d && d.chk) {
        ichk = d.chk;
      }
    });
    var el = document.getElementById('clear-ikey');
    if(el) {
      el.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        localforage.removeItem('ikey-data');
        t.app.replaceUrl('/verification', {email: email, pass: pass});
      });
    }
  }

  form.addEventListener('submit', function(e){
    var verify_pass  = form.verify_pass.value;
    var beta  = form.beta ? form.beta.value : '';
    var tos_accepted = form.tos.checked;
    if(verify_pass !== pass) {
      form.error.msg('Password does not match', 'Please confirm the password you entered on the previous screen or return to the last step');
      form.verify_pass.focus();
      return;
    }
    if(!beta && !ikey) {
      form.error.msg('Beta Code Required', 'This application is in beta<br/>A beta code is required in order to create an account');
      form.verify_pass.focus();
      return;
    }
    if(!tos_accepted) {
      form.error.msg('You must accept Terms of Service', 'You must accept the Terms of Service and Privacy Policy<br>in order to use this website');
      form.verify_pass.focus();
      return;
    }
    form.disable();
    t.acct.verification.send(email, pass, {beta: beta, ikey: ikey, ichk: ichk}).then(function(xhr) {
      if(xhr.status == 201) {
        t.app.replaceUrl('/verification-sent', {email: email});
      } else {
        form.enable();
        form.error.msg('Verification could not be sent');
      }
    }).catch(function(xhr){
      form.enable();
      if(xhr.status == 403) {
        if(ikey) {
          form.error.msg('Invite Code does not match', 'Make sure you are using the correct email address');
        } else {
          form.error.msg('Invalid Beta Code', 'You need a team invite or a valid beta code to create a new account. If you received a team invite, start over by clicking the link in the email');
          form.beta.focus();
        }
      } else if(xhr.status == 404 && ikey) {
          form.error.msg('Invite Code Expired', 'You can still create an account if you have a beta code');
      } else {
        form.enable();
        form.error.msg('Verification could not be sent', 'please try again');
      }
    });
  });

}
