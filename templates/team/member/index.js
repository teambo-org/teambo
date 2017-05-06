function(t){
  "use strict";

  t.view.on(['member-removed', 'member-updated'], function(e) {
    t.refresh({silent: true});
  });

}
