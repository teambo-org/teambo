function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.verification);
  var email = form.getAttribute('data-email');
  var pass  = form.getAttribute('data-pass');
  var ikey  = form.getAttribute('data-ikey');
  var ichk;

  if(!email) {
    t.app.gotoUrl('/login');
  }

  if(ikey) {
    localforage.getItem('ikey-data').then(function(d) {
      if(d && d.chk) {
        ichk = d.chk;
      }
    });
  }

  form.pass.value = pass;
  if(pass) {
    form.verify_pass.focus();
  } else {
    form.pass.focus();
  }

  var pass_meter = document.getElementById('pass-meter');
  var pass_meter_bar = document.getElementById('pass-meter-bar');
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
    update_bar(result.score);
  };
  var update_bar = function(score) {
    pass_meter_bar.style.width = 100*Math.min((score + 1) / 4, 1) + '%';
    pass_meter_bar.style.backgroundColor = ['#900', '#960', '#990', '#690', '#090'][score];
  }
  zxcvbn_init();

  var clearError = function(e) {
    e.target.classList.remove('error');
  }
  form.pass.addEventListener('input', clearError);
  form.verify_pass.addEventListener('input', clearError);
  form.beta.addEventListener('input', clearError);
  form.tos.addEventListener('change', clearError);

  form.addEventListener('submit', function(e){
    var verify_pass  = form.verify_pass.value;
    var beta  = form.beta ? form.beta.value : '';
    var tos_accepted = form.tos.checked;
    if(!pass_is_good) {
      form.error.msg('Password is not strong enough', pass_feedback ? pass_feedback : 'You must use a strong password');
      form.pass.focus();
      form.pass.classList.add('error');
      return;
    }
    if(verify_pass !== pass) {
      form.error.msg('Password does not match', 'Please confirm the password you entered on the previous screen or return to the last step');
      form.verify_pass.focus();
      form.verify_pass.classList.add('error');
      return;
    }
    if(!beta) {
      form.error.msg('Beta Code Required', 'This application is in beta<br/>A beta code is required in order to create an account');
      form.beta.focus();
      form.beta.classList.add('error');
      return;
    }
    if(!tos_accepted) {
      form.error.msg('You must accept Terms of Service', 'You must accept the Terms of Service and Privacy Policy<br>in order to use this website');
      form.tos.focus();
      form.tos.classList.add('error');
      return;
    }
    form.disable();
    var data = {beta: beta};
    if(ikey == form.beta.value) {
      data['ikey'] = ikey;
      data['ichk'] = ichk;
    }
    t.acct.verification.send(email, pass, data).then(function(xhr) {
      t.app.replaceUrl('/verification/sent', {email: email});
    }).catch(function(xhr){
      form.enable();
      if(xhr.status === 403) {
        if(ikey) {
          form.error.msg('Invite Code does not match', 'Make sure you are using the correct email address');
        } else {
          form.error.msg('Invalid Beta Code', 'You need a team invite or a valid beta code to create a new account. If you received a team invite, start over by clicking the link in the email');
          form.beta.focus();
        }
      } else if(xhr.status === 409) {
        form.error.msg('Account already exists', 'An account already exists with that email address and password<br/><a href="#/login" id="back-to-login" class="create-account"><i class="icon-angle-left"></i>Back to Login<i class="icon-blank"></i></a>');
        document.getElementById('back-to-login').onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          t.app.gotoUrl('/login', {email: email, pass: form.pass.value});
        };
      } else if(xhr.status === 404 && ikey) {
        form.error.msg('Invite Code Expired', 'You can still create an account if you have a beta code');
      } else if(xhr.status === 0) {
        form.error.msg('Verification could not be sent', 'You must be online in order to create an account');
      } else {
        t.app.trace(xhr);
        form.error.msg('Verification could not be sent', 'please try again');
      }
    });
  });

}
