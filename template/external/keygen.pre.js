function(t){
  "use strict";

  if(t.acct.current.rsa) {
    t.app.gotoUrl('/account');
    return false;
  }

}
