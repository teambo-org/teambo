Teambo.model.plan = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      item_list: function() {
        return t.model.item.getByPlan(self.id);
      },
      item_list_incomplete: function() {
        return self.item_list().filter(function(o) {
          return o.opts.status !== 'complete';
        });
      },
      item_list_incomplete_assigned: function() {
        return self.item_list_incomplete().filter(function(o) {
          return o.assigned();
        });
      },
      item_list_incomplete_unassigned: function() {
        return self.item_list_incomplete().filter(function(o) {
          return !o.assigned();
        });
      },
      item_list_complete: function() {
        return self.item_list().filter(function(o) {
          return o.opts.status === 'complete';
        });
      },
      item_list_mine_complete: function() {
        return self.item_list_complete().filter(function(o) {
          return o.assignedToMe();
        });
      },
      item_list_mine_incomplete: function() {
        return self.item_list_incomplete().filter(function(o) {
          return o.assignedToMe();
        });
      },
      member_has_items: function() {
        return self.item_list().filter(function(o) {
          return t.model.member.current && o.assignedTo(t.model.member.current.id);
        }).length;
      },
      member_item_list_complete: function() {
        return self.item_list_complete().filter(function(o) {
          return t.model.member.current && o.assignedTo(t.model.member.current.id);
        });
      },
      member_item_list_incomplete: function() {
        return self.item_list_incomplete().filter(function(o) {
          return t.model.member.current && o.assignedTo(t.model.member.current.id);
        });
      },
      item_count: function() {
        return self.item_list().length;
      },
      item_count_incomplete: function() {
        return self.item_list_incomplete().length;
      },
      item_count_mine_incomplete: function() {
        return self.item_list_mine_incomplete().length;
      },
      progress: function() {
        return self.item_list().length ? (self.item_list_complete().length / self.item_list().length) * 100 : 100;
      },
      parentModel: function() {
        return model.get(self.opts.parid);
      },
      created: function() {
        var h = self.hist[0];
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
    parid: { type: 'string', required: true,  minLength: 8, maxLength: 8 },
    name:  { type: 'string', required: true,  maxLength: 256 },
    desc:  { type: 'string', required: false, maxLength: 65535 },
    start: { type: 'string', required: false, minLength: 10, maxLength: 10, empty: true },
    end:   { type: 'string', required: false, minLength: 10, maxLength: 10, empty: true }
  });

  t.model.extend(model);

  model.getActiveId = function() {
    return model.current ? model.current.id : (t.model.item.current ? t.model.item.current.opts.plan_id : null);
  };

  model.member_list = function() {
    return model.all.filter(function(plan) {
      return plan.member_has_items();
    });
  };

  return model;

})(Teambo);
