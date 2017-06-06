Teambo.model.folder = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      item_collection: function() {
        return t.model.item.collect_all().filter_folder_id(this.id);
      },
      item_list: function() {
        return this.item_collection().models;
      },
      item_count: function() {
        return this.item_collection().count();
      },
      item_count_incomplete: function() {
        return this.item_collection().filter_incomplete().count();
      },
      item_count_complete: function() {
        return this.item_collection().filter_complete().count();
      },
      progress: function() {
        var total = this.item_count();
        return total ? (this.item_count_complete() / total) * 100 : 100;
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

  t.model._extend(model);

  model.getActiveId = function() {
    return model.current ? model.current.id : (t.model.item.current ? t.model.item.current.opts.folder_id : null);
  };

  model.orphaned = new model({
    id: "(none)",
    opts: {
      name: "(none)",
      description: "These items do not belong to an existing folder"
    }
  });

  model.orphaned.fake = true;

  model.orphaned.item_collection = function() {
    return t.model.item.collect_all().filter_orphaned();
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
