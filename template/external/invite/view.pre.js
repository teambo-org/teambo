function(t){
  "use strict";

  if(t.acct.isAuthed() && !t.acct.current.rsa && !t.app.testing) {
    t.app.gotoUrl('/keygen');
    return false;
  }

}
