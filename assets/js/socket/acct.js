Teambo.socket.acct = (function (t) {
  "use strict";

  var socket = t.socket.extend({
    url: function() {
      return t.acct.current && t.acct.current.socketUrl();
    }
  });

  var handle = function(e) {
    if(!e.iv) {
      return;
    } else if(e.iv == 'removed') {
      socket.stop();
      t.acct.deAuth();
      t.gotoUrl('/login');
    } else {
      t.acct.current.refresh(e.iv).then(function(new_acct) {
        t.acct.current = new_acct;
        socket.stop();
        t.refresh({silent: true});
      }).catch(function(){
        t.socket.inviteAcceptance.start();
      });
    }
  };

  socket.on('message', function(evt) {
    var parts = evt.data.split('-');
    var e = {
      id : parts[0],
      iv : parts[1]
    };
    handle(e);
  });

  return socket;

})(Teambo);
