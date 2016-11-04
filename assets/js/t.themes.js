Teambo.themes = (function(){
  "use strict";

  var h2r = function(h, s, v) {
    var rgb = hsvToRgb( h/360, s, v);
    return [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])].join(',');
  };

  var slate = function(h) {
    return {
      "chat":  {"bg": h2r(h, 0.75, 0.3), "hi": h2r(h, 0.75, 1), "color": "255,255,255"},
      "main":  {"bg": "16,16,16",        "hi": h2r(h, 0.8,  1), "color": "255,255,255"},
      "right": {"bg": h2r(h, 0.75, 0.3), "hi": h2r(h, 0.75, 1), "color": "255,255,255"}
    };
  };
  var dark = function(h) {
    return {
      "chat":  {"bg": h2r(h, 0.75, 0.3), "hi": h2r(h, 0.75, 1), "color": "255,255,255"},
      "main":  {"bg": h2r(h, 1, 0.1),    "hi": h2r(h, 0.8,  1), "color": "255,255,255"},
      "right": {"bg": h2r(h, 0.75, 0.3), "hi": h2r(h, 0.75, 1), "color": "255,255,255"}
    };
  };
  // var light = function(h) {
    // return {
      // "chat":  {"bg": h2r(h, 0.75, 0.3), "hi": h2r(h, 0.75, 1), "color": "255,255,255"},
      // "main":  {"bg": h2r(h, 0.05,  1),  "hi": h2r(h, 0.75, 0.5), "color": h2r(h, 1, 0.05)},
      // "right": {"bg": h2r(h, 0.75, 0.3), "hi": h2r(h, 0.75, 1), "color": "255,255,255"}
    // };
  // };

  return {
    Dark : {
      "chat":  {"bg": "0,0,0",  "hi": "255,255,255", "color": "255,255,255"},
      "main":  {"bg": "0,0,0",  "hi": "255,255,255", "color": "255,255,255"},
      "right": {"bg": "24,24,24", "hi": "255,255,255", "color": "255,255,255"}
    },
    'Dark Red'     : dark(0),
    'Dark Orange'  : dark(30),
    'Dark Yellow'  : dark(60),
    'Dark Green'   : dark(120),
    'Dark Teal'    : dark(180),
    'Dark Blue'    : dark(210),
    'Dark Violet'  : dark(270),
    'Dark Magenta' : dark(300),
    'Slate Red'     : slate(0),
    'Slate Orange'  : slate(30),
    'Slate Yellow'  : slate(60),
    'Slate Green'   : slate(120),
    'Slate Teal'    : slate(180),
    'Slate Blue'    : slate(210),
    'Slate Violet'  : slate(270),
    'Slate Magenta' : slate(300),
    // 'Light Red'     : light(0),
    // 'Light Orange'  : light(30),
    // 'Light Yellow'  : light(60),
    // 'Light Green'   : light(120),
    // 'Light Teal'    : light(180),
    // 'Light Blue'    : light(210),
    // 'Light Violet'  : light(270),
    // 'Light Magenta' : light(300),
    Neon : {
      "chat":  {"bg": "0,128,192", "hi": "0,0,0",       "color": "255,255,255"},
      "main":  {"bg": "0,0,0",     "hi": "255,255,255", "color": "255,255,255"},
      "right": {"bg": "128,0,128", "hi": "0,0,0",       "color": "255,255,255"}
    },
    Default : slate(210)
  };

})();
