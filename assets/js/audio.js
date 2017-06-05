Teambo.audio = (function(t){
  "use strict";

  var sounds = {};

  return {
    play: function(id, volume) {
      if(id in sounds) {
        var clone = sounds[id].cloneNode(true);
        if(volume) {
          clone.volume = volume;
        }
        clone.play();
        clone.onended = function() {
          clone.remove();
        }
      }
    },
    loadAll: function(sources) {
      sources.forEach(function(v) {
        var audio = document.createElement('audio');
        audio.src = "/audio/"+v;
        audio.autobuffer = true;
        audio.preload = 'none';
        audio.load();
        sounds[v.split('.')[0]] = audio;
      })
    }
  };

})(Teambo);
