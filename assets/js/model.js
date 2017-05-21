Teambo.model = (function(t){
  "use strict";

  var model = function(data, model) {
    var self = this;
    if(typeof data == 'string') {
      var iv = data.split(' ')[0];
      data = t.team.decrypt(data);
      if(!data) {
        return;
      }
      data.iv = data.iv ? data.iv : iv;
    }
    t.object.extend(this, {
      type: model.type,
      id:   data.id,
      iv:   data.iv,
      orig: data.opts ? t.object.clone(data.opts) : {},
      opts: data.opts ? data.opts : {},
      hist: data.hist ? data.hist : [],
      // Template engine requires these prototype methods to be defined directly on the model
      //   instance in order to pass hasOwnProperty check
      history: model.prototype.history,
      active: model.prototype.active
    });
    this.alias();
  };

  // See ./model/_extend for shared model methods and properties
  // See ./model/_prototype for shared model instance methods

  model.types = [];

  model.uncacheAll = function() {
    var p = [];
    model.types.forEach(function(type) {
      p.push(model[type].uncacheAll());
    });
    return Promise.all(p);
  };

  model.searchAll = function(q) {
    var ret = {};
    var total = 0;
    var total_searched = 0
    model.types.forEach(function(type) {
      var models = [];
      var fields = model[type].schema.searchFields();
      model[type].all.forEach(function(m) {
        for(var i in fields) {
          if(m.id.indexOf(q) >= 0 || (m.opts[fields[i]] && m.opts[fields[i]].toLowerCase().indexOf(q) >= 0)) {
            models.push(m);
            break;
          }
        }
      });
      ret[type] = models;
      ret['has_'+type] = !!models.length;
      ret['count_'+type] = models.length;
      ret['total_'+type] = model[type].all.length;
      total              = total + models.length;
      total_searched     = total_searched + model[type].all.length;
    });
    ret.total = total;
    ret.empty = total === 0;
    ret.total_searched = total_searched;
    ret.total_inf = total === 1 ? '' : 's';
    ret.total_searched_inf = total_searched === 1 ? '' : 's';
    return ret;
  };

  model.integrity = function() {
    var ivs = [];
    model.types.forEach(function(type) {
      model[type].all.forEach(function(model){
        ivs.push(type + "-" + model.id + "-" + model.iv);
      });
    });
    return ivs.sort();
  };

  model.integrityCheck = function(ivs) {
    return new Promise(function(fulfill, reject) {
      t.xhr.post('/team/integrity', {
        data: {
          team_id: t.team.current.id,
          mkey: t.team.current.mkey,
          ivs: ivs
        }
      }).then(function(xhr) {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          fulfill(data.log);
        } else {
          reject(xhr);
        }
      }).catch(function(xhr) {
        reject(xhr);
      });
    });
  };

  return model;

})(Teambo);
