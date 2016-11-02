Teambo.schema = (function(t){
  "use strict";
  
  var validate_property = function(rules, k, data) {
    var err = null;
    for(var r in rules) {
      if(r == 'type' && typeof data[k] != rules[r]) {
        err = k + " does not match expected type: " + rules[r];
        break;
      }
      if(r == 'required' && rules[r] && !(k in data) || data[k] == null) {
        err = k + " does not match expected type: " + rules[r];
        break;
      }
      if(r == 'minLength' || r == 'maxLength') {
        if(['string', 'array'].indexOf(typeof data[k]) < 0) {
          err = "Schema error: "+ k +" - properties of type " + (typeof data[k]) + " cannot my constrained by " + r;
          break;          
        }
        if(r == 'minLength' && data[k].length < rules[r]) {
          err = k + " must have minimum length of " + rules[r];
          break;
        }
        if(r == 'maxLength' && data[k].length > rules[r]) {
          err = k + " must have maximum length of " + rules[r];
          break;
        }
      }
    }
    return err;
  };
  
  var schema = function(rules) {
    t.extend(this, {
      validate: function(data) {
        var errs = [];
        for(var k in data) {
          if(!(k in rules)) {
            delete(data[k]);
            continue;
          }
          var err = validate_property(rules[k], k, data);
          if(err) {
            errs.push(err);
          }
        }
        return errs;
      }
    });
  };
  
  return schema;

})(Teambo);
