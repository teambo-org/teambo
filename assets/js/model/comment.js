Teambo.model.comment = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      parentModel: function() {
        return t.model[self.opts.ptype].get(self.opts.pid);
      },
      created: function() {
        var h = self.hist[0];
        return h ? h.ts : null;
      },
      member: function() {
        return t.model.member.get(self.opts.member_id);
      },
      url: function() {
        return '/'+t.team.current.id+'/comment/'+self.id;
      },
      editable: function() {
        return self.opts.member_id == t.acct.current.member().id;
      }
    });
  };

  model.type = 'comment';

  model.schema = new t.schema({
    pid:       { type: 'string', required: true, minLength: 8, maxLength: 8 },
    ptype:     { type: 'string', required: true },
    text:      { type: 'string', required: true },
    member_id: { type: 'string', required: true, minLength: 8, maxLength: 8 }
  });

  t.model.extend(model);

  model.allByModel = function(type, id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.pid === id && o.opts.ptype === type) {
        ret.push(o);
      }
    }
    return ret;
  };

  return model;

})(Teambo);
