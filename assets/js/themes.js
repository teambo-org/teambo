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
      "main":  {"bg": "20,20,20",            "hi": h2r(h,  1*s, 1*v), "color": "255,255,255"},
      "right": {"bg": h2r(h2, 0.8*s, 0.2*v), "hi": h2r(h2, 1*s, 1*v), "color": "255,255,255"},
      "chat":  {"bg": h2r(h3, 0.5*s, 0.1*v), "hi": h2r(h3, 1*s, 1*v), "color": "255,255,255"}
    };
  };
  var full = function(h1, s1, v1, h2, s2, v2) {
    return {
      "main":  {"bg": h2r(h1, s1, v1), "hi": h2r(h2, s2, v2), "color": "255,255,255"},
      "right": {"bg": h2r(h1, 0.9*s1, 1.5*v1), "hi": h2r(h2, s2, v2), "color": "255,255,255"},
      "chat":  {"bg": h2r(h1, 0.9*s1, v1), "hi": h2r(h2, s2, v2), "color": "255,255,255"}
    }
  };
  var full2 = function(h1, s1, v1, h2, s2, v2) {
    return {
      "main":  {"bg": h2r(h1, s1, v1), "hi": h2r(h2, s2, v2), "color": "255,255,255"},
      "right": {"bg": h2r(h1, 0.9*s1, 1*v1), "hi": h2r(h2, s2, v2), "color": "255,255,255"},
      "chat":  {"bg": h2r(h1, 0.9*s1, v1), "hi": h2r(h2, s2, v2), "color": "255,255,255"}
    }
  };

  return {
    'Blood Orange' : full(0,   1,   0.14, 30,  1,   1),
    'Soft Leather' : full(30,  0.9, 0.11, 30,  0.6, 1),
    'Forest'       : full(50,  1,   0.07, 90,  1,   1),
    'Wheatgrass'   : full(110, 1,   0.13, 70,  1,   1),
    'Permafrost'   : full(180, 1,   0.12, 160, 0.9, 1),
    'Moonlight'    : full(210, 1,   0.11, 210, 0.5, 1),
    'Ocean Blue'   : full(210, 1,   0.14, 180, 1,   1),
    'Navy Blue'    : full(240, 0.9, 0.14, 210, 0.7, 1),
    'Black Light'  : full2(270, 1, 0.13, 240, 0.7, 1),
    'Lavender'     : full(270, 0.8, 0.13, 270, 0.5, 1),
    'Grape Soda'   : full(270, 0.8, 0.13, 300, 0.9, 0.9),

    'Slate Red'        : slate(0,   0.8),
    'Slate Orange'     : slate(30,  0.9),
    'Slate Yellow'     : slate(60,  0.9),
    'Slate Chartreuse' : slate(90,  1),
    'Slate Green'      : slate(120, 0.9),
    'Slate Azure'      : slate(155, 0.9),
    'Slate Teal'       : slate(180, 1),
    'Slate Aqua'       : slate(210, 0.8),
    'Slate Blue'       : slate(240, 0.6),
    'Slate Violet'     : slate(270, 0.7),
    'Slate Magenta'    : slate(300, 0.8),
    'Slate Crimson'    : slate(330, 1),

    Default : slate(180)
  };

})();
