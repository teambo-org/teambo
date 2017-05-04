(function(t){
  "use strict";

  document.addEventListener("keydown", function(e) {
    var key = e.key === " " ? "spacebar" : e.key.toLowerCase();
    if((e.ctrlKey && key === 's') || (e.ctrlKey && key === 'enter')) {
      return submitParentForm(e);
    }
    if((['SELECT', 'TEXTAREA'].indexOf(e.target.nodeName) >= 0 || (e.target.nodeName === "INPUT" && !e.target.classList.contains('submit'))) && key !== "escape") {
      return;
    }
    if(e.ctrlKey && key === 'q') {
      e.preventDefault();
      return window.location.hash = "";
    }
    if(key === "f5" || e.ctrlKey && key === 'r') {
      return pageReload(e);
    }
    if(e.ctrlKey || e.altKey) {
      return;
    }
    if (["arrowdown", "s"].indexOf(key) >= 0) {
      return moveFocus(e, 'down');
    }
    if (["arrowup", "w"].indexOf(key) >= 0) {
      return moveFocus(e, 'up');
    }
    if (["arrowleft", "a"].indexOf(key) >= 0) {
      return switchPane(e, 'left');
    }
    if (["arrowright", "d"].indexOf(key) >= 0) {
      return switchPane(e, 'right');
    }
    if(key === "z") {
      e.preventDefault();
      return t.chat.toggle();
    }
    if(key === "spacebar" && document.activeElement !== null) {
      e.preventDefault();
      return document.activeElement.click();
    }
    var keybind = document.querySelectorAll('a[data-keybind~="'+key+'"]');
    if(keybind.length) {
      return keybind[0].click();
    }
  }, false);

  var submitParentForm = function(e) {
    var parent_form = t.dom.findParent(e.target, 'form');
    if(parent_form && parent_form._submit) {
      e.preventDefault();
      parent_form._submit();
      return;
    }
  };

  var switchPane = function(e, dir) {
    e.preventDefault();
    var pane = t.dom.findParent(e.target, '#left, #main, #right, #chat');
    var pane_id = pane ? pane.id : 'main';
    switch(pane_id) {
      case 'main':
      case 'chat':
        focusPane(dir);
        break;
      case 'left':
        if(dir === 'right') {
          focusPane('main');
        }
        break;
      case 'right':
        if(dir === 'left') {
          focusPane('main');
        }
        break;
    }
  };

  var focusPane = function(id) {
    var targets = document.querySelectorAll('#'+id+' a.default-focus');
    targets = targets.length ? targets : document.querySelectorAll('#'+id+' a[href]');
    targets[0].focus();
  };

  var pageReload = function(e) {
    e.preventDefault();
    if(e.shiftKey && t.online()) {
      localforage.clear().then(function(){
        t.reload();
      });
    } else {
      t.reload();
    }
  };

  var moveFocus = function(e, dir) {
    e.preventDefault();
    var el = e.target;
    var pane = t.dom.findParent(el, '#left, #main, #right, #chat');
    var targets = (pane || document).querySelectorAll('a[href], input.submit, select');
    for(var i in targets) {
      if(targets[i] === el) {
        i = parseInt(i);
        for(var j = 0; j < targets.length; j++) {
          if (dir === 'down') {
            var new_i = i+j+1 < targets.length ? i + j + 1 : 0;
          } else {
            var new_i = i-j-1 >= 0 ? i-j-1 : targets.length - i - j - 1;
          }
          if(targets[new_i].offsetParent === null || targets[new_i].classList.contains('skip-nav')) {
            continue;
          }
          targets[new_i].focus();
          return;
        }
      }
    }
    targets[0].focus();
  };

})(Teambo);
