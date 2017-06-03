function(t){
  "use strict";

  var run = function() {
    if(window.fractal) {
      window.fractal.stripes(true);
      window.fractal.reset();
      window.fractal.unpause();
    } else {
      setTimeout(run, 100);
    }
  };
  setTimeout(run, 100);

}
