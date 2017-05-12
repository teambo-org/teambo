function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.auth);
  var vkey = form.getAttribute("data-vkey");
  var email;
  var pass;

  var form_submit_login = function(email, pass) {
    var password_reset = function() {
      form.enable();
      form.error.msg('Incorrect password', 'If you forgot your password, you may request a <a href="#/reset" id="reset">Password Reset</a>');
      document.getElementById('reset').onclick = function(e) {
        e.preventDefault();
        t.replace('/verification', {
          reset: true,
          email: email,
          pass: pass
        });
      };
    }
    t.acct.auth(email, pass).then(function(xhr){
      if(xhr === true || xhr.status === 200) {
        t.view.set('acct', t.acct.current);
        var remember_me = form.remember_me;
        if(remember_me && remember_me.checked) {
          t.acct.current.rememberMe();
        }
        t.gotoUrl(t.afterAuth());
      } else if(xhr.status === 404) {
        t.replace('/verification', {
          email: email,
          pass:  pass
        });
      } else if(xhr.status === 403) {
        password_reset();
      }
    }).catch(function() {
      if(t.online()) {
        form.error.msg('Unknown error', "Please try again in a few minutes.");
      } else {
        form.error.msg('You are offline', "You must log in once from this device while online<br/>before accessing your account in offline mode.");
      }
      form.enable();
    });
  };

  var form_submit_verification = function(email, pass) {
    t.acct.verification.confirm(vkey, email, pass).then(function(xhr) {
      t.view.set('acct', t.acct.current);
      t.gotoUrl('/account');
    }).catch(function(e){
      form.enable();
      if(e.status == 404) {
        form.error.msg('Verification has expired', 'Please ensure your password is correct or refresh the page to start the process over.');
      } else if(e.status == 500) {
        form.error.msg('Verification failed', 'Please refresh the page and try again');
      } else {
        form.error.msg('Error', 'Verification failed');
      }
    });
  };

  var form_init = function(form_submit_fn) {
    form.style.display = 'block';
    form.addEventListener('submit', function(e){
      e.preventDefault();
      form.error.hide();
      email = form.email.value;
      pass  = form.pass.value;
      form.disable();
      form_submit_fn(email, pass);
    });
    form.email.focus();
    form.email.oninput = form.error.hide;
    form.pass.oninput  = form.error.hide;
  }

  if(vkey != '') {
    t.acct.verification.confirm(vkey).then(function(xhr) {
      t.view.set('acct', t.acct.current);
      t.gotoUrl('/account');
    }).catch(function(e){
      form.error.msg('', '<br/>Enter your email address and password<br/>to complete verification');
      document.getElementById('onboarding').innerHTML = '';
      form_init(form_submit_verification);
    });
  } else {
    form_init(form_submit_login);
  }

  if(t.acct.isAuthed()) {
    t.gotoUrl('/account');
  }

  t.view.updateStatus();

}
