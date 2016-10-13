(function(t){
    "use strict";

    if(!t.isChild('right', document.activeElement)) {
        document.querySelector('a[name=skipnav]').focus();
    }

})(Teambo);
