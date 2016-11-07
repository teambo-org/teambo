function(t){
  "use strict";

  if(!t.isChild('right', document.activeElement)) {
    document.querySelector('a[name=skipnav]').focus();
  }

  t.view.on('team-updated', function(e) {
    if(e.id == t.team.current.id) {
      t.refresh({silent: true});
    }
  });

}
