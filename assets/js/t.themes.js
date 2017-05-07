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
  var mix = function(method, h1, s1, h2, s2) {
    return {
      "main":  {"bg": h2r(h1, s1, 0.15),  "hi": h2r(h2,  s2,  1), "color": "255,255,255"},
      "right": {"bg": method(h1, s1).right.bg, "hi": method(h2, s2).right.hi, "color": "255,255,255"},
      "chat":  {"bg": method(h1, s1).chat.bg,  "hi": method(h2, s2).chat.hi, "color": "255,255,255"}
    }
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
    'Slate Violet'     : slate(270, 0.8),
    'Slate Magenta'    : slate(300, 0.9),
    'Slate Crimson'    : slate(330, 1),

    'Blood Orange' : mix(deep, 0,   1,   30,  1),
    'Spring Green' : mix(deep, 120, 1,   60,  1),
    'Ocean Blue'   : mix(deep, 210, 1,   180, 1),
    'Permafrost'   : mix(deep, 180, 1,   155, 0.9),
    'Lavender'     : mix(deep, 270, 0.8, 270, 0.5),
    'Grape Soda'   : mix(deep, 270, 0.8, 300, 1),

    Default : slate(180)
  };

})();
