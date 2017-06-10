function(t){
  "use strict";

  if(!t.acct.isAuthed()) {
    t.app.gotoUrl('/login', {'silent': true});
    return false;
  }

}
