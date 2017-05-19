function(t){
  "use strict";

  t.view.progress('#left .progress');

  var left_toggle = t.view.toggle.init('#left');

  left_toggle.on('toggled', function(opts) {
    t.team.findCached('left_toggle').then(function(val){
      var data = {};
      if(val) {
        data = JSON.parse(val);
      }
      data[opts.name] = opts.open;
      t.team.cache('left_toggle', JSON.stringify(data));
    });
  });

}