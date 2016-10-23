Teambo.bucket = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      item_list: function() {
        return t.item.getByBucket(self.id);
      },
      item_list_incomplete: function() {
        return self.item_list().filter(function(o) {
          return o.opts.status !== 'complete';
        });
      },
      item_list_complete: function() {
        return self.item_list().filter(function(o) {
          return o.opts.status === 'complete';
        });
      },
      item_count: function() {
        return self.item_list().length;
      },
      progress: function() {
        return (self.item_list_complete().length / self.item_list().length) * 100;
      }
    });
  };
  
  model.type = 'bucket';
  
  t.model.extend(model);

  return model;

})(Teambo);
