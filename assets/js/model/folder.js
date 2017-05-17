Teambo.model.folder = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      item_list: function() {
        return t.model.item.getByFolder(self.id);
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
      item_count_complete: function() {
        return self.item_list_complete().length;
      },
      progress: function() {
        return self.item_list().length ? (self.item_list_complete().length / self.item_list().length) * 100 : 100;
      },
      url: function() {
        return '/'+t.team.current.id+'/folder/'+self.id;
      },
      icon: function() {
        return self.active() ? 'folder-open' : 'folder';
      },
      active: function() {
        return ((model.current && model.current.id == self.id)
            || (t.model.item.current && t.model.item.current.opts.folder_id == self.id)) ? 'active' : '';
      }
    });
  };

  model.type = 'folder';

  model.schema = new t.schema({
    pid:         { type: 'string', required: false, minLength: 8, maxLength: 8 },
    name:        { type: 'string', required: true,  maxLength: 256, searchable: true },
    description: { type: 'text',   required: false, maxLength: 65535, searchable: true }
  });

  t.model.extend(model);

  model.getActiveId = function() {
    return model.current ? model.current.id : (t.model.item.current ? t.model.item.current.opts.folder_id : null);
  };

  model.orphaned = new model({
    id: "orphaned",
    opts: {
      name: "(none)",
      description: "This is a list of items that don't belong to any existing folders."
    }
  });

  model.orphaned.fake = true;

  model.orphaned.item_list = function() {
    return t.model.item.getOrphaned();
  };

  model.list = function() {
    var extra = [];
    if(t.model.item.hasOrphaned()) {
      extra.push(model.orphaned);
    }
    return model.all.concat(extra);
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