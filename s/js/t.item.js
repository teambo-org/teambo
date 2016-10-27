Teambo.item = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      status: function() {
        return model.statuses[self.opts.status];
      },
      bucket: function() {
        return t.bucket.all[self.opts.bucket_id];
      },
      url: '/'+t.team.current.id+'/'+self.opts.bucket_id+'/'+self.id
    });
  };
  
  model.type = 'item';
  
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

  model.findByBucket = function(bucket_id) {
    return t.promise(function(fulfill, reject) {
      model.findAll().then(function(items){
        var ret = [];
        for(var i in items) {
          if(items[i].opts.bucket_id == bucket_id) {
            ret.push(items[i]);
          }
        }
        fulfill(ret);
      }).catch(function(e){
        reject(e);
      });
    });
  };

  model.statuses = {
    ready : {
      label: 'Ready',
      icon: 'check-empty'
    },
    blocked : {
      label: 'Blocked',
      icon: 'attention'
    },
    inprogress : {
      label: 'In Progress',
      icon: 'child'
    },
    qa: {
      label: 'Under QA',
      icon: 'sliders'
    },
    complete : {
      label: 'Complete',
      icon: 'ok-squared'
    }
  };

  return model;

})(Teambo);
