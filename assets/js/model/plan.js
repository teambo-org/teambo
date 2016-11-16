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
      }
    });
  };

  model.type = 'plan';

  model.schema = new t.schema({
    parid: { type: 'string', required: true,  minLength: 8, maxLength: 8 },
    name:  { type: 'string', required: true,  maxLength: 256 },
    desc:  { type: 'string', required: false, maxLength: 65535 },
    start: { type: 'string', required: false, minLength: 10, maxLength: 10 },
    end:   { type: 'string', required: false, minLength: 10, maxLength: 10 }
  });

  t.model.extend(model);

  return model;

})(Teambo);
