function(t){
  "use strict";
  
  if(t.acct.current.rsa) {
    t.app.gotoUrl('/account');
    return;
  }
  
  var createKey = function(){
    var inner = document.getElementById('progressbar-inner');
    var progressCallback = function(p){
      inner.style.width = (p/6)*100+'%';
    };
    t.acct.current.genrsa(progressCallback).then(function(key) {
      t.acct.current.save().then(function() {
        t.app.gotoUrl('/account');
      });
    });
  };
  setTimeout(createKey, 50);
  
}
