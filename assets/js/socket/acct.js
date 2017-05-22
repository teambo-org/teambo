Teambo.socket.acct = (function (t) {
  "use strict";

  var socket = new t.socket({
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
      t.app.gotoUrl('/login');
    } else if(e.iv == 'moved') {
      socket.stop();
      t.acct.deAuth();
      t.app.gotoUrl('/login', {passchange: true});
    } else if(e.iv) {
      t.acct.current.refresh(e.iv).then(function(new_acct) {
        if(new_acct) {
          t.acct.current = new_acct;
          socket.stop();
          t.app.refresh({silent: true});
        } else {
          t.socket.inviteAcceptance.start();
        }
      });
    }
  };

  socket.on('message', function(e) {
    e.id = e.channel_id;
    handle(e);
  });

  return socket;

})(Teambo);
