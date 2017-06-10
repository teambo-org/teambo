function(t){
  "use strict";

  if(t.acct.isAuthed()) {
    t.app.gotoUrl('/account', {'silent': true});
    return false;
  }

}
