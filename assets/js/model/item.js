Teambo.model.item = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      status: function() {
        return t.findByProperty(model.statuses, 'key', self.opts.status);
      },
      bucket: function() {
        return t.model.bucket.get(self.opts.bucket_id);
      },
      plan: function() {
        return t.model.plan.get(self.opts.plan_id);
      },
      member: function() {
        return t.model.member.get(self.opts.member_id);
      },
      comments: function() {
        return t.model.comment.allByModel(model.type, self.id);
      },
      url: function() {
        var item_url = '/item/' + self.id;
        var plan_url = t.model.plan.current ? '/plan/' + t.model.plan.current.id : '';
        return '/'+t.team.current.id + plan_url + item_url;
      },
      assigned: function() {
        return self.member() ? true : false;
      },
      assignedTo: function(member_id) {
        return self.opts.member_id == member_id;
      },
      assignedToMe: function() {
        var member = self.member();
        return member && member.isMe();
      },
      complete: function() {
        return self.opts.status === 'complete';
      }
    });
  };

  model.type = 'item';

  model.schema = new t.schema({
    name:        { type: "string", required: true,  maxLength: 256 },
    description: { type: "string", required: false, maxLength: 65535 },
    bucket_id:   { type: "string", required: false, minLength: 8, maxLength: 8 },
    plan_id:     { type: "string", required: false, minLength: 8, maxLength: 8 },
    member_id:   { type: "string", required: false, minLength: 8, maxLength: 8 },
    status:      { type: "string", required: true,  maxLength: 16 }
  });

  t.model.extend(model);

  model.getByBucket = function(bucket_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.bucket_id == bucket_id) {
        ret.push(o);
      }
    }
    return ret;
  };

  model.getByPlan = function(plan_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.plan_id === plan_id) {
        ret.push(o);
      }
    }
    return ret;
  };

  model.getByMember = function(member_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.member_id === member_id) {
        ret.push(o);
      }
    }
    return ret;
  };

  model.hasOrphaned = function() {
    var bucket_ids = t.model.bucket.ids();
    for(var i in model.all) {
      if(bucket_ids.indexOf(model.all[i].opts.bucket_id) < 0) {
        return true;
      }
    }
  };

  model.getOrphaned = function() {
    var bucket_ids = t.model.bucket.ids();
    var ret = [];
    for(var i in model.all) {
      if(bucket_ids.indexOf(model.all[i].opts.bucket_id) < 0) {
        ret.push(model.all[i]);
      }
    }
    return ret;
  };

  var wrap_statuses = function(statuses) {
    statuses.forEach(function(el) {
      el.active = function() {
        return model.current && model.current.opts.status == el.key;
      };
    });
    return statuses
  };
  model.statuses = wrap_statuses([
    { key: 'ready',      label: 'Ready',       icon: 'check-empty' },
    { key: 'blocked',    label: 'Blocked',     icon: 'attention' },
    { key: 'inprogress', label: 'In Progress', icon: 'child' },
    { key: 'qa',         label: 'Under QA',    icon: 'sliders' },
    { key: 'complete',   label: 'Complete',    icon: 'check-1' }
  ]);

  return model;

})(Teambo);
