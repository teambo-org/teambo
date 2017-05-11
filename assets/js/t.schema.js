Teambo.schema = (function(t){
  "use strict";

  var validate_property = function(rules, prop, orig, key) {
    var errs = [];
    var type = typeof prop;
    if(type === 'object') {
      type = Array.isArray(prop) ? 'array' : type;
    }
    for(var r in rules) {
      if(r === 'values') {
        if(type !== 'object') {
          errs.push("Schema error: "+ key +" - properties of type " + type + " cannot be constrained by " + r);
          break;
        }
        if(type !== 'object') {
          errs.push("Schema error: "+ key +" - properties of type " + rules['type'] + " cannot be constrained by " + r);
          break;
        }
        Object.keys(prop).forEach(function (k) {
          errs = errs.concat(validate_schema(rules[r], prop[k], orig[k], key));
        });
        break;
      }
      if(r === 'type' && type !== rules[r]) {
        errs.push(key + " does not match expected type: " + rules[r]);
        break;
      }
      if(r === 'required' && rules[r] && !prop || prop === null) {
        errs.push(key + " is required and is not present.");
        break;
      }
      if(r === 'minLength' || r === 'maxLength' && !(rules['empty'] && !prop)) {
        if(type !== 'string' && type !== 'array') {
          errs.push("Schema error: "+ key +" - properties of type " + type + " cannot be constrained by " + r);
          break;
        }
        if(r === 'minLength' && prop.length > 0 && prop.length < rules[r]) {
          errs.push(key + " must have minimum length of " + rules[r]);
          break;
        }
        if(r === 'maxLength' && prop.length > rules[r]) {
          errs.push(key + " must have maximum length of " + rules[r]);
          break;
        }
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
      }
      errs = errs.concat(validate_property(rules[k], data[k], orig[k], prefix + k));
    }
    return errs;
  };

  var schema = function(rules) {
    t.extend(this, {
      validate: function(data, orig) {
        return validate_schema(rules, data, orig);
      }
      // diff
      // merge
    });
  };

  return schema;

})(Teambo);
