Teambo.schema = (function(t){
  "use strict";

  var validate_property = function(rules, val, orig, key) {
    var errs = [];
    var type = typeof val;
    if(type === 'object') {
      type = Array.isArray(val) ? 'array' : type;
    }
    if('alias' in rules) {
      return errs;
    }
    if(!('type' in rules)) {
      errs.push(key + " does not have a declared type");
    } else if(val !== null && type !== rules.type && (type != 'string' || rules.type != 'text')) {
      errs.push(key + " does not match expected type: " + rules.type);
    }
    if('values' in rules) {
      if(type !== 'object') {
        errs.push("Schema error: "+ key +" - valerties of type " + type + " cannot be constrained by value");
      }
      Object.keys(val).forEach(function (k) {
        errs = errs.concat(validate_schema(rules.values, val[k], orig[k], key));
      });
    }
    if('required' in rules && rules.required && !val) {
      errs.push(key + " is required and is not present");
    } else {
      return errs
    }
    // nothing below this line is evaluated if
    if(('minLength' in rules || 'maxLength' in rules) && (val !== null || !rules.empty)) {
      if(type !== 'string' && type !== 'array') {
        errs.push("Schema error: "+ key +" - valerties of type " + type + " cannot be constrained by length");
      }
      if('minLength' in rules && !val || val.length < rules.minLength) {
        errs.push(key + " must have minimum length of " + rules.minLength);
      }
      if('maxLength' in rules && val && val.length > rules.maxLength) {
        errs.push(key + " must have maximum length of " + rules.maxLength);
      }
    }
    return errs;
  };

  var validate_schema = function(rules, data, orig, prefix) {
    prefix = prefix ? prefix + '.' : '';
    orig = orig ? orig : {};
    var errs = [];
    for(var k in data) {
      if(!(k in rules) || !('type' in rules[k])) {
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
      rules: rules,
      searchFields: function() {
        return Object.keys(rules).filter(function(field){return !!rules[field].searchable;});
      },
      getAliasProps: function() {
        var aliasProps = [];
        for(var k in rules) {
          if('alias' in rules[k]) {
            aliasProps.push({oldProp: k, newProp: rules[k].alias});
          }
        }
        return aliasProps;
      }
      // merge
    });
  };;

  return schema;

})(Teambo);
