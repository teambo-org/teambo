var form = new t.form(document.auth),
    vkey = form.getAttribute("data-vkey"),
    email,
    pass;
var form_submit_login = function(email, pass) {
    var password_reset = function() {
        form.enable();
        form.error.msg('Incorrect password', 'If you forgot your password, you may request a <a href="#/reset" id="reset">Password Reset</a>');
        t.id('reset').onclick = function(e) {
            e.preventDefault();
            t.replace('/verification', {
                reset: true,
                email: email,
                pass: pass
            });
        };
    }
    t.acct.auth(email, pass).then(function(xhr){
        if(xhr.status === 200) {
            t.gotoUrl(t.afterAuth());
        } else if(xhr.status === 404) {
            t.replace('/verification', {
                email: email,
                pass:  pass
            });
        } else if(xhr.status === 403) {
            password_reset();
        }
    }).catch(function(xhr){
        if(xhr.status === 200) {
            password_reset();
        } else {
            form.enable();
            form.error.msg('Error', 'You cannot log in while you are offline.');
        }
    });
};
var form_submit_verification = function(email, pass) {
    t.acct.verification.confirm(vkey, email, pass).then(function(xhr) {
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
var form_init = function(form_submit) {
    form.style.display = 'block';
    form.addEventListener('submit', function(e){
        e.preventDefault();
        form.error.hide();
        email = form.email.value;
        pass  = form.pass.value;
        form.disable();
        form_submit(email, pass);
    });
    form.email.focus();
    form.email.oninput = form.error.hide;
    form.pass.oninput = form.error.hide;
}
if(vkey != '') {
    t.acct.verification.confirm(vkey).then(function(xhr) {
        t.gotoUrl('/account');
    }).catch(function(e){
        form.error.msg('', '<br/>Enter your email address and password<br/>to complete verification');
        t.id('onboarding').innerHTML = '';
        form_init(form_submit_verification);
    });
} else {
    form_init(form_submit_login);
}
if(t.acct.isAuthed()) {
    t.gotoUrl('/account');
}
