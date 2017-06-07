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
        return t.team.current.url() + plan_url + item_url;
      },
      plan_url: function() {
        var item_url = '/item/' + self.id;
        var plan_url = this.plan() ? '/plan/' + this.plan().id : '';
        return t.team.current.url() + plan_url + item_url;
      },
      planned: function() {
        return !!self.plan();
      },
      assigned: function() {
        return !!self.member();
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
      },
      date_completed: function() {
        for(var i = this.hist.length-1; i >= 0; i--) {
          if(this.hist[i].diff.status == "complete") {
            return this.hist[i].ts;
          }
        }
        return 0;
      },
      icon: function() {
        return this.status().icon;
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

  t.model._extend(model);

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

  model.collection = function(models) {
    t.model.collection.apply(this, [models]);
    t.object.extend(this, {
      filter_plan_id: function(plan_id) {
        return this.filter(function(item) {
          return item.opts.plan_id == plan_id;
        });
      },
      filter_folder_id: function(folder_id) {
        return this.filter(function(item) {
          return item.opts.folder_id == folder_id;
        });
      },
      filter_orphaned: function() {
        return this.filter(function(item) {
          return item.folder() === t.model.folder.orphaned;
        });
      },
      filter_complete: function() {
        return this.filter(function(item) {
          return item.complete();
        });
      },
      filter_incomplete: function() {
        return this.filter(function(item) {
          return !item.complete();
        });
      },
      filter_planned: function() {
        return this.filter(function(item) {
          return item.planned();
        });
      },
      filter_assigned: function() {
        return this.filter(function(item) {
          return item.assigned();
        });
      },
      filter_unassigned: function() {
        return this.filter(function(item) {
          return !item.assigned();
        });
      },
      filter_member: function(member) {
        var member_id = member ? member.id : null;
        if(!member_id) {
          return new model.collection([]);
        } else {
          return this.filter(function(item) {
            return item.assignedTo(member_id);
          });
        }
      },
      filter_member_current: function() {
        return this.filter_member(t.model.member.current);
      },
      filter_mine: function() {
        var member_id = t.acct.current.member().id;
        return this.filter(function(item) {
          return item.assignedTo(member_id);
        });
      },
      filter: function(fn) {
        return new model.collection(this.models.filter(fn));
      },
      order_created_desc: function() {
        return this.sort(function(a, b) {
          if(!a.hist.length || !b.hist.length) return -1;
          return a.hist[0].ts < b.hist[0].ts ? 1 : a.hist[0].ts > b.hist[0].ts ? -1 : 0;
        });
      },
      order_completed_desc: function() {
        return this.sort(function(a, b) {
          var a_ts = a.date_completed();
          var b_ts = b.date_completed();
          return a_ts < b_ts ? 1 : a_ts > b_ts ? -1 : 0;
        });
      },
      order_member: function() {
        return this.sort(function(a, b) {
          return a.opts.member_id < b.opts.member_id ? 1 : a.opts.member_id > b.opts.member_id ? -1 : 0;
        });
      },
      sort: function(fn) {
        this.models.sort(fn);
        return this;
      },
      limit_10: function() {
        return new model.collection(this.models.slice(0, 10));
      }
    });
  };

  return model;

})(Teambo);
