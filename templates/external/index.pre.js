function(t){
  "use strict";

  if(t.acct.isAuthed()) {
    t.app.gotoUrl('/account', {'silent': true});
    return false;
  } else {
    t.app.gotoUrl('/login', {'silent': true});
    return false;
  }

}
