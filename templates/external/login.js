function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.auth);
  var vkey = form.getAttribute("data-vkey");
  var email;
  var pass;
  var ikey;

  localforage.getItem('ikey-data').then(function(d) {
    if(d && d.ikey) {
      ikey = d.ikey;
    }
  });

  document.getElementById('signup').onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    t.app.gotoUrl('/signup', {ikey: ikey});
  };

  var form_submit_login = function(email, pass) {
    var password_incorrect = function() {
      form.enable();
      form.error.msg('Incorrect email address or password', 'If you forgot your password, you may want to<br/><a href="#/reset" id="reset" class="create-account">Create a New Account<i class="icon-angle-right"></i></a>');
      document.getElementById('reset').onclick = function(e) {
        e.preventDefault();
        t.app.replaceUrl('/verification', {reset: true, email: email, pass: pass, ikey: ikey});
      };
    }
    t.acct.auth(email, pass).then(function(xhr){
      if(xhr === true || xhr.status === 200) {
        var remember_me = form.remember_me;
        if(remember_me && remember_me.checked) {
          t.acct.current.rememberMe();
        }
        var after_auth = t.app.afterAuth ? t.app.afterAuth : '/account';
        t.app.afterAuth = null;
        t.app.gotoUrl(after_auth);
      } else if(xhr.status === 404 || xhr.status === 403) {
        password_incorrect();
      }
    }).catch(function() {
      if(t.app.online) {
        form.error.msg('Unknown error', "Please try again in a few minutes.");
      } else {
        form.error.msg('You are offline', "You must log in once from this device while online<br/>before accessing your account in offline mode.");
      }
      form.enable();
    });
  };

  var form_submit_verification = function(email, pass) {
    t.acct.verification.confirm(vkey, email, pass).then(function(xhr) {
      t.app.gotoUrl('/account');
    }).catch(function(e){
      form.enable();
      if(e.status == 404) {
        form.error.msg('Verification has expired', 'Please ensure your password is correct or refresh the page to start the process over.');
      } else if(e.status == 500) {
        form.error.msg('Verification failed', 'Please refresh the page and try again');
      } else {
        form.error.msg('Unknown Error', 'Verification failed, please try again.');
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
    form.pass.oninput = form.error.hide;
  }

  if(vkey != '') {
    var display_verification_msg = function() {
      form_init(form_submit_verification);
      document.getElementById('onboarding').innerHTML = '';
      form.error.msg('', '<br/>Enter your email address and password<br/>to complete verification');
    };
    if(t.app.easy_verification) {
      t.acct.verification.confirm(vkey).then(function(xhr) {
        localforage.removeItem('verification');
        t.app.gotoUrl('/account');
      }).catch(function(e){
        // localforage.removeItem('verification');
        display_verification_msg();
      });
    } else {
      display_verification_msg();
    }
  } else {
    if(t.app.easy_verification) {
      localforage.removeItem('verification');
    }
    form_init(form_submit_login);
  }

  if(t.acct.isAuthed()) {
    t.app.gotoUrl('/account');
  }

  t.view.updateStatus();

}
