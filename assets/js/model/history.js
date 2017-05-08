Teambo.model.history = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.extend(this, data);
    t.extend(this, {
      status: function() {
        return t.findByProperty(t.model.item.statuses, 'key', self.diff.status);
      },
      bucket: function() {
        return t.model.bucket.get(self.diff.bucket_id);
      },
      plan: function() {
        return t.model.plan.get(self.diff.plan_id);
      },
      assignee: function() {
        return t.model.member.get(self.diff.member_id);
      },
      member: function() {
        return t.model.member.get(self.member_id);
      },
      diff_name: function() {
        return 'name' in self.diff;
      },
      diff_description: function() {
        return 'description' in self.diff;
      },
      diff_plan_id: function() {
        return 'plan_id' in self.diff;
      },
      diff_bucket_id: function() {
        return 'bucket_id' in self.diff;
      },
      diff_member_id: function() {
        return 'member_id' in self.diff;
      },
      diff_status: function() {
        return 'status' in self.diff;
      },
      diff_text: function() {
        return 'text' in self.diff;
      }
    });
  };
  
  model.create = function(data) {
    return new model(data);
  };

  return model;

})(Teambo);
