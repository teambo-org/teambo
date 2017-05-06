Teambo.themes = (function(){
  "use strict";

  var h2r = function(h, s, v) {
    v = Math.max(Math.min(v, 1), 0);
    var rgb = hsvToRgb( h/360, s, v);
    return [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])].join(',');
  };

  var slate = function(h, s, v) {
    s = s || 1;
    v = v || 1;
    var h2 = h;
    var h3 = h;
    return {
      "main":  {"bg": "24,24,24",            "hi": h2r(h,  1*s, 1*v), "color": "255,255,255"},
      "right": {"bg": h2r(h2, 0.8*s, 0.2*v), "hi": h2r(h2, 1*s, 1*v), "color": "255,255,255"},
      "chat":  {"bg": h2r(h3, 0.5*s, 0.1*v), "hi": h2r(h3, 1*s, 1*v), "color": "255,255,255"}
    };
  };
  var soft = function(h, s, v) {
    s = s || 1;
    v = v || 1;
    var h2 = h;
    var h3 = h;
    return {
      "main":  {"bg": h2r(h3, 0.8*s, 0.35*v), "hi": h2r(h,  0.8*s, 1*v), "color": "255,255,255"},
      "right": {"bg": h2r(h2, 0.8*s, 0.5*v), "hi": h2r(h2, 0.8*s, 1*v), "color": "255,255,255"},
      "chat":  {"bg": h2r(h3, 0.8*s, 0.4*v), "hi": h2r(h3, 0.8*s, 1*v), "color": "255,255,255"}
    };
  };
  var dark = function(h, s, v) {
    s = s || 1;
    v = v || 1;
    var h2 = h;
    var h3 = h;
    return {
      "main":  {"bg": h2r(h,  0.8*s, 0.2*v), "hi": h2r(h,  0.8*s,  1*v), "color": "255,255,255"},
      "right": {"bg": h2r(h2, 0.8*s, 0.2*v), "hi": h2r(h2, 0.8*s,  1*v), "color": "255,255,255"},
      "chat":  {"bg": h2r(h3, 0.8*s, 0.2*v), "hi": h2r(h3, 0.75*s, 1*v), "color": "255,255,255"}
    };
  };

  return {
    'Slate Red'     : slate(0, 0.8),
    'Slate Orange'  : slate(30, 0.9),
    'Slate Yellow'  : slate(60, 0.8),
    'Slate Green'   : slate(120, 0.9),
    'Slate Teal'    : slate(180),
    'Slate Blue'    : slate(210, 0.9),
    'Slate Violet'  : slate(270, 0.7),
    'Slate Magenta' : slate(300, 0.9),
    'Dark Red'     : dark(0, 0.9),
    'Dark Orange'  : dark(30, 0.9),
    'Dark Yellow'  : dark(60, 0.8),
    'Dark Green'   : dark(120, 0.9),
    'Dark Teal'    : dark(180, 0.9),
    'Dark Blue'    : dark(210, 0.9),
    'Dark Violet'  : dark(270, 0.8),
    'Dark Magenta' : dark(300, 0.9),
    'Soft Red'      : soft(0, 0.8),
    'Soft Orange'   : soft(30, 0.9),
    'Soft Yellow'   : soft(60, 0.8),
    'Soft Green'    : soft(120, 0.8),
    'Soft Teal'     : soft(180),
    'Soft Blue'     : soft(210, 0.9),
    'Soft Violet'   : soft(270, 0.7),
    'Soft Magenta'  : soft(300, 0.8),
    Default : slate(180)
  };

})();
