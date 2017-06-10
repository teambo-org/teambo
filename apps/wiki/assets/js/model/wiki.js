Teambo.model.wiki = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      url: function() {
        return '/'+t.team.current.id+'/wiki/'+self.id;
      },
      icon: function() {
        return self.opts.parent_id ? 'angle-right' : 'book';
      },
      siblings: function() {
        return model.allByParent(self.opts.parent_id);
      },
      children: function() {
        return model.allByParent(self.id);
      },
      parents: function() {
        var ret = [];
        var par = model.get(self.opts.parent_id);
        while(par) {
          ret.push(par);
          par = model.get(par.opts.parent_id);
        }
        return ret.reverse();
      },
      hasChildren: function() {
        return self.children().length;
      }
    });
    if(self.opts.parid) {
      self.opts.parent_id = self.opts.parid;
    }
    if(self.opts.title) {
      self.opts.name = self.opts.title;
    }
  };

  model.type = 'wiki';

  model.schema = new t.schema({
    parent_id: { type: 'string', required: false, minLength: 8, maxLength: 8, empty: true },
    name:      { type: 'string', required: true,  maxLength: 256, searchable: true },
    text:      { type: 'text',   required: false, maxLength: 65535, searchable: true }
  });

  t.model._extend(model);

  model.top = function() {
    return model.allByParent(null);
  };

  model.allByParent = function(parent_id) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.parent_id == parent_id || (!o.opts.parent_id && !parent_id)) {
        ret.push(o);
      }
    }
    return ret;
  };

  return model;

})(Teambo);
