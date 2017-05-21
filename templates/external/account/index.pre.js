function(t){
  "use strict";

  if(!t.acct.isAuthed()) {
    t.app.gotoUrl('/login', {'silent': true});
    return false;
  }

  if(!t.acct.current.rsa && !t.app.testing) {
    t.app.gotoUrl('/keygen');
    return false;
  }

  var d = sessionStorage.getItem('ikey-data');
  var d = d ? JSON.parse(d) : {};
  if(d && d.ikey) {
    t.app.gotoUrl('/invite', d);
    return false;
  }

}
