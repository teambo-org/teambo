(function(){
  var animationFrame;
  var deg_to_rad = Math.PI / 180.0;
  var depth_start = 7;
  var n = 8;
  var zoom = 12.5;
  var rotation = 180;
  var curl = -45;
  var twist = 180;
  var a_curl = -.15;
  var a_twist = 0;
  var rgb;
  var elem = document.getElementById('bgcanvas');
  var ctx = elem.getContext('2d');
  var last = fps_tick = Date.now();
  var rgb = [];
  var running = false;
  var reset = function() {
    depth_start = Math.min(15, depth_start);
    depth_start = Math.max(1, depth_start);
    zoom = Math.min(20, zoom);
    zoom = Math.max(1, zoom);
    n = Math.max(1, n);
    n = Math.min(48, n);
    rotation = Math.max(0, rotation);
    rotation = Math.min(360, rotation);
    elem.width = w = window.innerWidth;
    elem.height = h = window.innerHeight;
    var start = Date.now();
    for(var i = 0; i < 300; i++) {
      ctx.strokeStyle = "rgba(0,0,0,0)";
      ctx.beginPath();
      ctx.moveTo(start_x, start_y);
      ctx.lineTo(Math.random()*w, Math.random()*h);
      ctx.stroke();
    }
    if(stripes) {
      ctx.setLineDash([2, 2]);
    }
    var f = Date.now() - start;
    depth_start = f > 1 ? 6 : 7;
    var hue_shift = Math.random();
    for(i=depth_start-1; i > 1; i--) {
      var h = (i/(depth_start+1))+hue_shift;
      var c = hsvToRgb(h % 1, 0.5, 0.9);
      rgb[i] = "rgba("+parseInt(c[0])+","+parseInt(c[1])+","+parseInt(c[2])+",0.1)";
    }
    rgb[3] = "rgba(255,255,255, 0.5)";
    elem.style.display = "block";
    window.cancelAnimationFrame(animationFrame);
  }
  var logo = document.getElementById('logo');
  var rect = logo.getBoundingClientRect();
  var start_length = logo.offsetHeight/zoom;
  var start_x = (rect.left + rect.right)/2;
  var start_y = rect.top + rect.height / 2;
  var dangle = 360/n;
  var stripes = false;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  var drawFractal = function() {
    if(!rect) {
      elem.style.display = "none";
      running = false;
      return;
    }
    running = true;
    var next = [];
    next[depth_start] = [];
    for(var i = 0; i < n; i++) {
      next[depth_start].push([start_x, start_y, i*(360/n) + (rotation/n)]);
    }
    for(var i = depth_start; i > 0; i--) {
      next[i-1] = [];
      ctx.beginPath();
      for(var j in next[i]) {
        var x1     = next[i][j][0],
            y1     = next[i][j][1],
            angle  = next[i][j][2];
        var dcurl = curl * (i / depth_start);
        var x2 = x1 + (Math.cos(angle * deg_to_rad) * i * start_length);
        var y2 = y1 + (Math.sin(angle * deg_to_rad) * i * start_length);
        if(i < depth_start-1) {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        if(i>2) {
          next[i - 1].push([x2, y2, angle - (dangle + dcurl) + twist]);
          next[i - 1].push([x2, y2, angle + (dangle + dcurl) + twist]);
        }
      }
      if(i < depth_start-1) {
        ctx.strokeStyle = rgb[i];
        ctx.stroke();
      }
    }
    curl  = (curl < 360*depth_start ? curl : curl - 360*depth_start) + a_curl;
    twist = (twist < 360 ? twist : twist - 360) + a_twist;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(drawFractal);
  };
  window.addEventListener('resize', function(e){
    elem.width = w = window.innerWidth;
    elem.height = h = window.innerHeight;
    logo = document.getElementById('logo');
    if(logo) {
      rect = logo.getBoundingClientRect();
      start_length = logo.offsetHeight/zoom;
      start_x = (rect.left + rect.right)/2;
      start_y = rect.top + rect.height / 2;
      drawFractal();
    }
  });
  window.addEventListener('scroll', function(e){
    logo = document.getElementById('logo');
    if(logo) {
      ctx.rect(0,0,elem.width,elem.height);
      ctx.fillStyle="rgba(255,255,255,1)";
      ctx.fill();
      rect = logo.getBoundingClientRect();
      start_length = logo.offsetHeight/zoom;
      start_x = (rect.left + rect.right)/2;
      start_y = rect.top + rect.height / 2;
      drawFractal();
    }
  });
  window.fractal = {
    unpause: function() {
      elem.style.display = "block";
      logo = document.getElementById('logo');
      if(logo) {
        rect = logo.getBoundingClientRect();
        start_length = logo.offsetHeight/zoom;
        start_x = (rect.left + rect.right)/2;
        start_y = rect.top + rect.height / 2;
      } else {
        rect = null;
      }
      drawFractal();
    },
    pause: function() {
      window.cancelAnimationFrame(animationFrame);
    },
    reset: reset,
    stripes: function(onoff) {
      stripes = !!onoff;
    }
  };
  reset();
  drawFractal();
})();