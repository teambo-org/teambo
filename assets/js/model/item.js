Teambo.model.item = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      status: function() {
        return t.array.findByProperty(model.statuses, 'key', self.opts.status);
      },
      folder: function() {
        return t.model.folder.get(self.opts.folder_id);
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
    name:        { type: "string", required: true,  maxLength: 256, searchable: true },
    description: { type: "text",   required: false, maxLength: 65535, searchable: true },
    folder_id:   { type: "string", required: false, minLength: 8, maxLength: 8 },
    plan_id:     { type: "string", required: false, minLength: 8, maxLength: 8 },
    member_id:   { type: "string", required: false, minLength: 8, maxLength: 8 },
    status:      { type: "string", required: true,  maxLength: 16 },
    bucket_id:   { alias: "folder_id" }
  });

  t.model.extend(model);

  model.getByFolder = function(folder_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.folder_id == folder_id) {
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
    var folder_ids = t.model.folder.ids();
    for(var i in model.all) {
      if(folder_ids.indexOf(model.all[i].opts.folder_id) < 0) {
        return true;
      }
    }
  };

  model.getOrphaned = function() {
    var folder_ids = t.model.folder.ids();
    var ret = [];
    for(var i in model.all) {
      if(folder_ids.indexOf(model.all[i].opts.folder_id) < 0) {
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
