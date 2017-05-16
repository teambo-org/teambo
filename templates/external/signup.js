function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.auth);
  var email;
  var pass;

  var form_submit_signup = function(email, pass) {
    t.acct.auth(email, pass).then(function(xhr){
      if(xhr === true || xhr.status === 200) {
        var after_auth = t.app.afterAuth ? t.app.afterAuth : '/account';
        t.app.afterAuth = null;
        t.app.gotoUrl(after_auth);
      } else if(xhr.status === 404) {
        t.app.replaceUrl('/verification', {email: email, pass: pass});
      } else {
        form.error.msg('Unknown error', "Please try again in a few minutes.");
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

  form_init(form_submit_signup);

  t.view.updateStatus();

}
