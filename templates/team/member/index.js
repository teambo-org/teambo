function(t){
  "use strict";

  t.view.on(['member-removed', 'member-updated'], function(e) {
    t.app.refresh({silent: true});
  });

}
