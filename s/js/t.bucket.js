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
      item_count_incomplete: function() {
        return self.item_list_incomplete().length;
      },
      progress: function() {
        return (self.item_list_complete().length / self.item_list().length) * 100;
      },
      url: function() {
        return '/'+t.team.current.id+'/'+self.id;
      }
    });
  };

  model.type = 'bucket';

  model.schema = new t.schema({
    name:        { type: "string", required: true,  minLength: 1, maxLength: 256 },
    description: { type: "string", required: false, maxLength: 65535 }
  });

  t.model.extend(model);

  model.orphaned = new model({
    id: "orphaned",
    opts: {
      name: "(none)",
      description: "This is a list of items that don't belong to any existing buckets."
    }
  });

  model.orphaned.item_list = function() {
    return t.item.getOrphaned();
  };

  var parent_get = model.get;
  model.get = function(id, skiporphaned) {
    var m = parent_get(id);
    if(!m && !skiporphaned) {
      return model.orphaned;
    } else {
      return m;
    }
  };

  return model;

})(Teambo);
