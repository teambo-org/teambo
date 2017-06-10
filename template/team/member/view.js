function(t){
  "use strict";

  t.view.on('member-updated', function(e) {
    if(e.id == t.model.member.current.id) {
      t.app.refresh({silent: true});
    }
  });

}
