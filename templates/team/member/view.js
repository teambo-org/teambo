function(t){
  "use strict";

  t.view.on('member-removed', function(e) {
    if(e.id == t.model.member.current.id) {
      t.gotoUrl(t.team.current.url(), false, {silent: true});
    }
  });
  t.view.on('member-updated', function(e) {
    if(e.id == t.model.member.current.id) {
      t.refresh({silent: true});
    }
  });

}