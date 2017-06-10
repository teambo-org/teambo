function(t){
  "use strict";

  var el = document.getElementById('account-password');
  var form = t.form(el);

  var pass;
  var pass_is_good;
  var pass_feedback;
  var passmeter = new t.view.passmeter(form, 'pass', 4);
  passmeter.on('change', function(result) {
    pass = result.password;
    pass_is_good = result.is_good;
    if(result.feedback.suggestions.length > 0) {
      pass_feedback = result.feedback.suggestions[0];
    }
  });
  passmeter.init();

  form.addEventListener('submit', function(e){
    var cur_pass     = form.cur_pass.value;
    var pass_confirm = form.pass_confirm.value;
    if(!pass_is_good) {
      form.error.msg('Password is not strong enough', pass_feedback ? pass_feedback : 'You must use a strong password');
      form.pass.focus();
      form.pass.classList.add('error');
      return;
    }
    if(cur_pass === pass) {
      form.error.msg('New password must be different', 'In order to change your password, your new password must be different');
      form.pass.focus();
      form.pass.classList.add('error');
      return;
    }
    if(pass_confirm !== pass) {
      form.error.msg('Password does not match', 'Please confirm the password you entered on the previous screen or return to the last step');
      form.pass_confirm.focus();
      form.pass_confirm.classList.add('error');
      return;
    }
    form.disable();
    t.acct.current.changePassword(cur_pass, pass).then(function(xhr) {
      t.acct.current.cacheAuth()
      t.app.replaceUrl('/account/password-saved');
    }).catch(function(xhr){
      form.enable();
      if(xhr.status === 403) {
        form.error.msg('Current Password Incorrect', 'You must enter your current password in order to change your password');
        form.cur_pass.focus();
      } else if(xhr.status === 409) {
        form.error.msg('Account already exists', 'Each account must have a unique email address and password combination');
        form.pass.focus();
      } else {
        t.app.trace(xhr);
        form.error.msg('Password could not be changed', 'Something went wrong, please try again');
      }
    });
  });

}
