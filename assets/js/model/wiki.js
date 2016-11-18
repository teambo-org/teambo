Teambo.model.wiki = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      url: function() {
        return '/'+t.team.current.id+'/wiki/'+self.id;
      },
      icon: function() {
        return 'book';
      },
      siblings: function() {
        return model.allByParent(self.opts.parid);
      },
      children: function() {
        return model.allByParent(self.id);
      },
      parents: function() {
        var ret = [];
        var par = model.get(self.opts.parid);
        while(par) {
          ret.push(par);
          par = model.get(par.opts.parid);
        }
        return ret.reverse();
      }
    });
  };

  model.type = 'wiki';

  model.schema = new t.schema({
    parid: { type: 'string', required: false, minLength: 8, maxLength: 8, empty: true },
    title: { type: "string", required: true,  maxLength: 256 },
    text:  { type: "string", required: false, maxLength: 65535 }
  });

  t.model.extend(model);

  model.top = function() {
    return model.allByParent(null);
  };

  model.allByParent = function(parid) {
    var ret = [];
    for(var i in model.all) {
      var o = model.all[i];
      if(o.opts.parid == parid || (!o.opts.parid && !parid)) {
        ret.push(o);
      }
    }
    return ret;
  };

  return model;

})(Teambo);
