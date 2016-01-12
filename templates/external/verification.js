var form = new t.form(document.verification),
    reset = form.getAttribute('data-reset');
document.verification.addEventListener('submit', function(e){
    var email = form.getAttribute('data-email'),
        pass  = form.getAttribute('data-pass');
    t.acct.verification.send(email, pass).then(function(xhr) {
        form.disable();
        if(xhr.status == 201) {
            t.replace('/verification-sent', {email: email});
        } else {
            form.enable();
            form.error.msg('Verification could not be sent');
        }
    }).catch(function(e){
        form.error.msg('Verification could not be sent', 'please try again');
    });
});
