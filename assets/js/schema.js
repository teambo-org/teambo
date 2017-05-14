Teambo.schema = (function(t){
  "use strict";

  var validate_property = function(rules, prop, orig, key) {
    var errs = [];
    var type = typeof prop;
    if(type === 'object') {
      type = Array.isArray(prop) ? 'array' : type;
    }
    if(!('type' in rules)) {
      errs.push(key + " does not have a declared type");
    } else if(type !== rules.type && (type != 'string' || rules.type != 'text')) {
      errs.push(key + " does not match expected type: " + rules.type);
    }
    if('values' in rules) {
      if(type !== 'object') {
        errs.push("Schema error: "+ key +" - properties of type " + type + " cannot be constrained by value");
      }
      Object.keys(prop).forEach(function (k) {
        errs = errs.concat(validate_schema(rules.values, prop[k], orig[k], key));
      });
    }
    if('required' in rules && rules.required && !prop || prop === null) {
      errs.push(key + " is required and is not present");
    }
    if(('minLength' in rules || 'maxLength' in rules) && !(rules['empty'] && !prop)) {
      if(type !== 'string' && type !== 'array') {
        errs.push("Schema error: "+ key +" - properties of type " + type + " cannot be constrained by length");
      }
      if('minLength' in rules && prop.length > 0 && prop.length < rules.minLength) {
        errs.push(key + " must have minimum length of " + rules.minLength);
      }
      if('maxLength' in rules && prop.length > rules.maxLength) {
        errs.push(key + " must have maximum length of " + rules.maxLength);
      }
    }
    return errs;
  };

  var validate_schema = function(rules, data, orig, prefix) {
    prefix = prefix ? prefix + '.' : '';
    var errs = [];
    for(var k in data) {
      if(!(k in rules)) {
        delete(data[k]);
        continue;
      } else if(orig && 'editable' in rules[k] && !rules[k].editable && typeof orig[k] !== 'undefined') {
        data[k] = orig[k];
        continue;
      }
      errs = errs.concat(validate_property(rules[k], data[k], orig[k], prefix + k));
    }
    return errs;
  };

  var textDiff = function(a, b) {
    var dmp = new diff_match_patch();
    var patch = dmp.patch_make(a, b);
    return dmp.patch_toText(patch);
  };

  var schema = function(rules) {
    t.object.extend(this, {
      validate: function(data, orig) {
        return validate_schema(rules, data, orig);
      },
      diff: function(orig, opts) {
        var diff = {};
        for(var i in opts) {
          if(orig[i] != opts[i]) {
            if('type' in rules[i] && rules[i].type == 'text' && orig[i]) {
              diff[i] = textDiff(orig[i], opts[i]);
            } else {
              diff[i] = opts[i];
            }
          }
        }
        return diff;
      },
      rules: rules
      // merge
    });
  };

  return schema;

})(Teambo);