Teambo.manifest = (function(t){
  "use strict";

  var init = function() {
    if('applicationCache' in window && window.applicationCache.status !== 0) {
      window.applicationCache.addEventListener('updateready', function(e) {
        if(window.applicationCache.status === window.applicationCache.UPDATEREADY
        || window.applicationCache.status === window.applicationCache.CHECKING) {
          if(!t.app.moved && !t.app.editing && (!t.team.current || !t.team.current.queue || !t.team.current.queue.processing())) {
            t.app.reload();
          } else {
            t.app.updateready = true;
          }
        }
        t.app.online = true;
      }, false);
      window.applicationCache.addEventListener('noupdate', function(e) {
        t.app.moved = true;
        t.app.online = true;
      }, false);
      window.applicationCache.addEventListener('downloading', function(e) {
        t.app.online = true;
      }, false);
      window.applicationCache.addEventListener('error', function(e) {
        t.app.online = false;
      }, false);
      var startCacheCheck = function() {
        if(!t.app.updateready) {
          setTimeout(function(){
            window.applicationCache.update();
            startCacheCheck();
          }, t.app.online ? 60000 : 10000);
        }
      };
      if(window.applicationCache.status === 3) {
        window.applicationCache.addEventListener('cached', function(e) {
          t.app.online = true;
          startCacheCheck();
        }, false);
      } else {
        startCacheCheck();
      }
    } else {
      t.app.online = true;
    }
  }

	return {
    init: init
  };

})(Teambo);
