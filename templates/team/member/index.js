function(t){
  "use strict";

  t.view.on(['member-updated', 'member-removed'], function(e) {
    t.app.refresh({silent: true});
  });

}
