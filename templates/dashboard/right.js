function(t){
    "use strict";
    
    var els = document.querySelectorAll('#right .progress');
    for(var i = 0; els[i]; i++) {
      var el = els[i];
      var remaining = document.createElement('div');
      remaining.style.width = Math.abs(100-parseFloat(el.dataset.progress)) + "%";
      remaining.style.float = 'right';
      remaining.classList.add('color-15');
      el.appendChild(remaining);
    }

}
