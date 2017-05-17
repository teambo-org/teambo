function(t){
  "use strict";

  t.view.on('member-removed', function(e) {
    if(e.id == t.model.member.current.id) {
      t.app.gotoUrl(t.team.current.url(), {silent: true});
    }
  });
  t.view.on('member-updated', function(e) {
    if(e.id == t.model.member.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
