Teambo.model.item = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      status: function() {
        return model.statuses[self.opts.status];
      },
      bucket: function() {
        return t.model.bucket.get(self.opts.bucket_id);
      },
      url: function() {
        return '/'+t.team.current.id+'/'+self.bucket().id+'/'+self.id;
      }
    });
  };

  model.type = 'item';

  model.schema = new t.schema({
    name:        { type: "string", required: true,  minLength: 1, maxLength: 256 },
    description: { type: "string", required: false, maxLength: 65535 },
    bucket_id:   { type: "string", required: true,  minLength: 8, maxLength: 8 },
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

  model.findByBucket = function(bucket_id) {
    return t.promise(function(fulfill, reject) {
      model.findAll().then(function(items){
        fulfill(items.reduce(function(p, c) {
          if(c.opts.bucket_id == bucket_id) {
            p.push(c); return p;
          }
        }, []));
      }).catch(function(e){
        reject(e);
      });
    });
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
      icon: 'check-1'
    }
  };

  return model;

})(Teambo);
