function(t){
  "use strict";

  var el = document.getElementById('account-password');
  var form = t.form(el);

  var pass_meter_bar = document.getElementById('pass-meter-bar');
  var pass;
  var pass_is_good;
  var pass_feedback;
  var zxcvbn_present;
  var zxcvbn_init = function() {
    if(!('zxcvbn' in window)) {
      form.disable();
      setTimeout(zxcvbn_init, 1000);
      return;
    }
    form.enable();
    zxcvbn_present = true;
    var check;
    form.pass.addEventListener('input', function(e) {
      form.error.hide();
      clearTimeout(check);
      check = setTimeout(check_password, 200);
    });
    form.pass.addEventListener('change', function(e) {
      clearTimeout(check);
      check = setTimeout(check_password, 200);
    });
    check_password();
  };
  var check_password = function() {
    pass = form.pass.value;
    var result = zxcvbn(pass);
    if(result.feedback.suggestions.length > 0) {
      pass_feedback = result.feedback.suggestions[0];
    }
    pass_is_good = result.score >= 3;
    update_bar(pass.length > 0 ? result.score : null);
  };
  var update_bar = function(score) {
    pass_meter_bar.style.width = score !== null ? 100*Math.min((score + 1) / 4, 1) + '%' : '0%';
    pass_meter_bar.style.backgroundColor = ['#900', '#960', '#990', '#690', '#090'][score];
  }
  zxcvbn_init();

  form.addEventListener('submit', function(e){
    var cur_pass     = form.cur_pass.value;
    var pass_confirm = form.pass_confirm.value;
    if(!pass_is_good) {
      form.error.msg('Password is not strong enough', pass_feedback ? pass_feedback : 'You must use a strong password');
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
