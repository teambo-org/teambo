Teambo.model.history = (function(t){
  "use strict";

  var model = function(data, parentModel) {
    var self = this;
    t.object.extend(this, data);
    t.object.extend(this, {
      status: function() {
        return t.array.findByProperty(t.model.item.statuses, 'key', self.diff.status);
      },
      folder: function() {
        return t.model.folder.get(self.diff.folder_id);
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
      diff_keys: function() {
        return Object.keys(self.diff).reduce(function(obj,key){obj['diff_'+key] = true;return obj;},{});
      },
      previous_value: function(key) {
        var schema = t.model[parentModel.type].schema;
        if(!key in schema.rules) {
          return;
        }
        var type = schema.rules[key].type;
        var dmp = new diff_match_patch();
        var val;
        for(var i in parentModel.hist) {
          var hist = parentModel.hist[i];
          if(hist.iv === self.iv) {
            break;
          }
          if(key in hist.diff) {
            if(type === 'text' && hist.diff[key].substr(0,2) === '@@') {
              var patch = dmp.patch_fromText(hist.diff[key]);
              var parts = dmp.patch_apply(patch, val);
              val = parts[0];
            } else {
              val = hist.diff[key];
            }
          }
        }
        return val;
      },
      nice_patch: function(key) {
        if(key in self.diff) {
          var text = self.diff[key];
          if(text.substr(0,2) !== '@@') {
            return t.view.escape(text).split("\r").join("").split("\n").join("<br>");
          }
          var prev = self.previous_value(key);
          var dmp = new diff_match_patch();
          var patch = dmp.patch_fromText(text);
          var parts = dmp.patch_apply(patch, prev);
          var merged = parts[0];
          prev = t.view.escape(prev);
          merged = t.view.escape(merged);
          var diff = dmp.diff_main(prev, merged);
          dmp.diff_cleanupSemantic(diff);
          return diff_prettyHtml(diff);
        }
      },
      nice_text_patch: function() {
        return self.nice_patch('text');
      },
      nice_description_patch: function() {
        return self.nice_patch('description');
      },
      nice_desc_patch: function() {
        return self.nice_patch('desc');
      }
    });
  };

  model.create = function(data, parentModel) {
    return new model(data, parentModel);
  };

  var diff_prettyHtml = function(diffs) {
    var html = [];
    var pattern_amp = /&/g;
    var pattern_lt = /</g;
    var pattern_gt = />/g;
    var pattern_para = /\n/g;
    for (var x = 0; x < diffs.length; x++) {
      var op = diffs[x][0];    // Operation (insert, delete, equal)
      var data = diffs[x][1];  // Text of change.
      var text = data;
      switch (op) {
        case 1: // DIFF_INSERT
          html[x] = '<ins>' + text + '</ins>';
          break;
        case -1: //DIFF_DELETE
          html[x] = '<del>' + text + '</del>';
          break;
        case 0: //DIFF_EQUAL
          html[x] = text;
          break;
      }
    }
    var lines = html.join('').split("\n");
    var skipping = true;
    var changed_lines = {};
    for(var i in lines) {
      var m = lines[i].match(/\<\/?(ins|del)\>/g);
      if(!skipping || m) {
        changed_lines[i] = true;
      }
      if(m) {
        skipping = !!(m.length % 2) ? !skipping : skipping;
      }
    }
    var out = [];
    for(var i in lines) {
      if(i in changed_lines) {
        out.push(lines[i]);
      }
    }
    return out.join("<br>").replace(/<br><br>/g, "<br>&nbsp;&nbsp;<br>");
  };

  return model;

})(Teambo);
