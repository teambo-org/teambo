function(t){
  "use strict";

  t.view.on('team-updated', function(e) {
    if(e.id == t.team.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
