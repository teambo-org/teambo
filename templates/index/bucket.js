function(t){
  "use strict";

  if(!t.isChild('right', document.activeElement) && !t.isChild('left', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

}
