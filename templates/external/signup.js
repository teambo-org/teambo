function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.auth);
  var ikey = form.dataset.ikey;
  var pass = form.dataset.pass;
  var email;

  var form_submit_signup = function(email) {
    t.app.gotoUrl('/verification', {email: email, pass: pass, ikey: ikey});
  };

  var form_init = function(form_submit_fn) {
    form.style.display = 'block';
    form.addEventListener('submit', function(e){
      e.preventDefault();
      form.error.hide();
      email = form.email.value;
      form.disable();
      form_submit_fn(email);
    });
    form.email.focus();
    form.email.oninput = form.error.hide;
  }

  form_init(form_submit_signup);

  t.view.updateStatus();
}
