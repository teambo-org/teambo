function(t){
  "use strict";

  if(!t.acct.isAuthed()) {
    t.app.gotoUrl('/login', {'silent': true});
    return false;
  }

  if(!t.acct.current.rsa) {
    t.app.gotoUrl('/keygen');
    return false;
  }

}
