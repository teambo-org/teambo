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
        for(var i in sources) {
            if(!sources[i]) {
                continue;
            }
            var audio = document.createElement('audio');
            audio.src = "/audio/"+sources[i]+".mp3";
            audio.autobuffer = true;
            audio.load();
            sounds[sources[i]] = audio;
        }
    };

})();