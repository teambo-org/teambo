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
      "main":  {"bg": h2r(h3, 0.9*s, 0.35*v), "hi": h2r(h, 0.9*s, 1*v), "color": "255,255,255"},
      "right": {"bg": h2r(h2, 0.9*s, 0.5*v), "hi": h2r(h2, 0.9*s, 1*v), "color": "255,255,255"},
      "chat":  {"bg": h2r(h3, 0.9*s, 0.4*v), "hi": h2r(h3, 0.9*s, 1*v), "color": "255,255,255"}
    };
  };
  var deep = function(h, s, v) {
    s = s || 1;
    v = v || 1;
    var h2 = h;
    var h3 = h;
    return {
      "main":  {"bg": h2r(h,  0.9*s, 0.2*v), "hi": h2r(h,  0.8*s,  1*v), "color": "255,255,255"},
      "right": {"bg": h2r(h2, 0.9*s, 0.2*v), "hi": h2r(h2, 0.8*s,  1*v), "color": "255,255,255"},
      "chat":  {"bg": h2r(h3, 0.9*s, 0.2*v), "hi": h2r(h3, 0.75*s, 1*v), "color": "255,255,255"}
    };
  };

  return {
    'Slate Red'        : slate(0,   0.8),
    'Slate Orange'     : slate(30,  0.9),
    'Slate Yellow'     : slate(60,  0.9),
    'Slate Chartreuse' : slate(90,  1),
    'Slate Green'      : slate(120, 0.9),
    'Slate Azure'      : slate(155, 0.9),
    'Slate Teal'       : slate(180, 1),
    'Slate Aqua'       : slate(210, 0.9),
    'Slate Blue'       : slate(240, 0.7),
    'Slate Violet'     : slate(270, 0.75),
    'Slate Magenta'    : slate(300, 0.9),
    'Slate Crimson'    : slate(330, 1),

    'Deep Red'        : deep(0, 1),
    'Deep Orange'     : deep(30, 1),
    'Deep Yellow'     : deep(60, 1),
    'Deep Chartreuse' : deep(90, 1),
    'Deep Green'      : deep(120, 1),
    'Deep Azure'      : deep(155, 1),
    'Deep Teal'       : deep(180, 1),
    'Deep Aqua'       : deep(210, 1),
    'Deep Blue'       : deep(240, 0.8),
    'Deep Violet'     : deep(270, 0.9),
    'Deep Magenta'    : deep(300, 1),
    'Deep Crimson'    : deep(330, 1),

    'Soft Red'        : soft(0,   0.8,  0.8),
    'Soft Orange'     : soft(30,  0.9,  0.8),
    'Soft Yellow'     : soft(60,  0.8,  0.8),
    'Soft Chartreuse' : soft(90,  0.9,  0.8),
    'Soft Green'      : soft(120, 0.8,  0.8),
    'Soft Azure'      : soft(155, 1,    0.8),
    'Soft Teal'       : soft(180, 1,    0.8),
    'Soft Aqua'       : soft(210, 0.9,  0.8),
    'Soft Blue'       : soft(240, 0.75, 0.8),
    'Soft Violet'     : soft(270, 0.9,  0.8),
    'Soft Magenta'    : soft(300, 0.8,  0.8),
    'Soft Crimson'    : soft(330, 0.8,  0.8),

    Default : slate(180)
  };

})();
