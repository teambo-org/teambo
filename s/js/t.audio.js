(function(){
    "use strict";
    
    var sounds = {};
    
    t.audio = {};
    
    t.audio.play = function(id, volume) {
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
    };
    
    t.audio.loadAll = function(sources) {
        sources.forEach(function(v) {
            var audio = document.createElement('audio');
            audio.src = "/audio/"+v+".mp3";
            audio.autobuffer = true;
            audio.preload = 'none';
            audio.load();
            sounds[v] = audio;
        })
    };

})();