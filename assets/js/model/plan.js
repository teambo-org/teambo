Teambo.model.plan = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      item_collection: function() {
        return t.model.item.collect_all().filter_plan_id(this.id);
      },
      item_count: function() {
        return this.item_collection().count();
      },
      item_count_complete: function() {
        return this.item_collection().filter_complete().count();
      },
      item_count_incomplete: function() {
        return this.item_collection().filter_incomplete().count();
      },
      progress: function() {
        var total = this.item_count();
        return total ? (this.item_count_complete() / total) * 100 : 100;
      },
      created: function() {
        var h = this.hist[0];
        return h ? h.ts : null;
      },
      url: function() {
        return '/'+t.team.current.id+'/plan/'+self.id;
      },
      icon: function() {
        return 'flag-1';
      },
      active: function() {
        return ((model.current && model.current.id == self.id)
            || (t.model.item.current && t.model.item.current.opts.plan_id == self.id)) ? 'active' : '';
      }
    });
  };

  model.type = 'plan';

  model.schema = new t.schema({
    name:  { type: 'string', required: true,  maxLength: 256, searchable: true },
    desc:  { type: 'text',   required: false, maxLength: 65535, searchable: true },
    start: { type: 'string', required: false, minLength: 10, maxLength: 10, empty: true },
    end:   { type: 'string', required: false, minLength: 10, maxLength: 10, empty: true }
  });

  t.model._extend(model);

  model.getActiveId = function() {
    return model.current ? model.current.id : (t.model.item.current ? t.model.item.current.opts.plan_id : null);
  };

  model.collection = function(models) {
    t.model.collection.apply(this, [models]);
    t.object.extend(this, {
      filter_current_member: function() {
        return this.filter(function(plan) {
          return !plan.item_collection()
            .filter_member_current()
            .empty();
        });
      },
      filter_incomplete_member_items: function() {
        return this.filter(function(plan) {
          return !plan.item_collection()
            .filter_member_current()
            .filter_incomplete()
            .empty();
        });
      },
      filter_complete_member_items: function() {
        return this.filter(function(plan) {
          return !plan.item_collection()
            .filter_member_current()
            .filter_complete()
            .empty();
        });
      },
      filter_incomplete_items_mine: function() {
        return this.filter(function(plan) {
          return !plan.item_collection()
            .filter_mine()
            .filter_incomplete()
            .empty();
        });
      },
      filter: function(fn) {
        return new model.collection(this.models.filter(fn));
      }
    });
  };

  return model;

})(Teambo);
