Teambo.view.passmeter = (function(t){
  "use strict";

  var passmeter = function(form_el, target_name, minimum) {
    var pass_meter_bar = document.getElementById('pass-meter-bar');
    var pass;
    var self = this;
    var zxcvbn_present;
    this.init = function() {
      if(!('zxcvbn' in window)) {
        form_el.disable();
        setTimeout(zxcvbn_init, 1000);
        return;
      }
      form_el.enable();
      zxcvbn_present = true;
      var check;
      form_el[target_name].addEventListener('input', function(e) {
        form_el.error.hide();
        clearTimeout(check);
        check = setTimeout(check_password, 200);
      });
      form_el[target_name].addEventListener('change', function(e) {
        clearTimeout(check);
        check = setTimeout(check_password, 200);
      });
      check_password();
    };
    var check_password = function() {
      pass = form_el[target_name].value;
      var result = zxcvbn(pass);
      console.log(result);
      result.is_good = result.score >= minimum;
      update_bar(pass.length > 0 ? result.score : -1);
      self.emit('change', result);
    };
    var update_bar = function(score) {
      pass_meter_bar.style.width = score >= 0 ? 100*Math.min((score + 1) / (minimum+1), 1) + '%' : '0%';
      pass_meter_bar.style.backgroundColor = ['#900', '#960', '#990', '#690', '#090'][score];
    }
    t.event.extend(this);
  };

  return passmeter;

})(Teambo);
