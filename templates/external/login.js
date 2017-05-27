function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.auth);
  var vkey = form.getAttribute("data-vkey");
  var email;
  var pass;
  var ikey;

  var d = sessionStorage.getItem('ikey-data');
  var d = d ? JSON.parse(d) : {};
  if(d && d.ikey) {
    ikey = d.ikey;
    form.error.msg('', '<br/>Log in or create an account to accept the invite');
  }

  document.getElementById('signup').onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    t.app.gotoUrl('/signup', {ikey: ikey});
  };

  var form_submit_login = function(email, pass) {
    t.acct.auth(email, pass).then(function(xhr){
      if(xhr === true || xhr.status === 200) {
        var remember_me = form.remember_me;
        if(remember_me && remember_me.checked) {
          t.acct.current.rememberMe();
        }
        var after_auth = t.app.afterAuth ? t.app.afterAuth : '/account';
        t.app.afterAuth = null;
        t.app.gotoUrl(after_auth);
      } else if(xhr.status === 404) {
        var d = JSON.parse(xhr.responseText);
        form.enable();
        form.error.msg('Incorrect email address or password',
          d.retries + ' attempts remaining before your account is locked<br/>' +
          'If you forgot your password, you may want to<br/>' +
          '<a href="" id="reset" class="bot-nav"><i class="icon-blank"></i>Create a New Account<i class="icon-angle-right"></i></a>');
        document.getElementById('reset').addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          t.app.gotoUrl('/verification', {reset: true, email: email, pass: pass, ikey: ikey});
        });
      } else if(xhr.status === 403) {
        var d = JSON.parse(xhr.responseText);
        if(d.resets) {
          form.error.msg('Account Locked', "Too many failed login attempts<br>To reset the account lock, you may<br/>" +
            "<a href='#/account/unlock' class='bot-nav' id='acct-unlock'>Verify your email address</i></a>");
            document.getElementById('acct-unlock').onclick = function(e) {
              e.preventDefault();
              e.stopPropagation();
              t.app.gotoUrl('/account/unlock', {email: email});
            };
        } else {
          form.error.msg('Account Locked', "Too many failed login attempts<br>Your account will unlock in "+d.ttl+" hours");
        }
        form.enable();
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
      form.disable();
      form.error.hide();
      email = form.email.value;
      pass  = form.pass.value;
      form_submit_fn(email, pass);
      form.pass.oninput = form.error.hide;
    });
    form.email.focus();
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

  t.view.updateStatus();

}
