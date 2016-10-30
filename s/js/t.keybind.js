(function(t){
  "use strict";

  document.addEventListener("keydown", function(e) {
    if((['SELECT', 'TEXTAREA'].indexOf(e.target.nodeName) >= 0 || (e.target.nodeName === "INPUT" && !e.target.classList.contains('submit'))) && e.key != "Escape") {
      return;
    }
    var key = e.key === " " ? "spacebar" : e.key.toLowerCase();
    if(e.ctrlKey && key == 'q') {
      window.location.hash = "";
    }
    if(e.ctrlKey || e.altKey) {
      return;
    }
    var sections = ['left', 'main', 'right'];
    if (["arrowdown", "s"].indexOf(key) >= 0) {
      var targets = document.querySelectorAll('a[href], input.submit');
      for(var i in targets) {
        if(targets[i] === e.target) {
          i = parseInt(i);
          for(var j = 0; j < targets.length; j++) {
            var new_i = i+j+1 < targets.length ? i+j+1 : 0;
            if(targets[new_i].offsetParent === null || targets[new_i].classList.contains('skip-nav')) {
              continue;
            }
            targets[new_i].focus();
            return;
          }
        }
      }
      targets[0].focus();
    } else if (["arrowup", "w"].indexOf(key) >= 0) {
      var targets = document.querySelectorAll('a[href], input.submit');
      for(var i in targets) {
        if(targets[i] === e.target) {
          i = parseInt(i);
          for(var j = 0; j < targets.length; j++) {
            var new_i = i-j-1 >= 0 ? i-j-1 : targets.length - i - j - 1;
            if(targets[new_i].offsetParent === null || targets[new_i].classList.contains('skip-nav')) {
              continue;
            }
            targets[new_i].focus();
            return;
          }
        }
      }
      targets[0].focus();
    }
    if(key === "z") {
      t.chat.toggle();
    }
    if(key === "spacebar" && document.activeElement !== null) {
      e.preventDefault();
      document.activeElement.click();
    }
    var keybind = document.querySelectorAll('a[data-keybind~="'+key+'"]');
    if(keybind.length) {
      keybind[0].click();
    }
  }, false);

})(Teambo);
