(function(t){
    "use strict";

    document.querySelectorAll('#right .progress').forEach(function(el) {
      var remaining = document.createElement('div');
      console.log(Math.abs(100-parseFloat(el.dataset.progress)));
      remaining.style.width = Math.abs(100-parseFloat(el.dataset.progress)) + "%";
      remaining.style.float = 'right';
      remaining.classList.add('color-15');
      el.appendChild(remaining);
    });

})(Teambo);
