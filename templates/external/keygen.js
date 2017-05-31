function(t){
  "use strict";

  window.fractal.pause();

  var createKey = function(){
    var inner = document.getElementById('progressbar-inner');
    var progressCallback = function(p){
      inner.style.width = (p/6)*100+'%';
    };
    t.acct.current.genrsa(progressCallback).then(function(key) {
      t.acct.current.save().then(function() {
        t.app.gotoUrl('/account');
      }).catch(function(e) {
        var error_form = t.form(document.getElementById('error-form'));
        error_form.error.msg('Could not save account', 'The account could not be saved. Please try again.<br><a href="#/login" class="logout"><i class="icon-angle-left"></i>Back to Login<i class="icon-blank"></i></a>');
        error_form.style.display = 'block';
      });
    });
  };
  setTimeout(createKey, 50);

}
