Teambo.socket.acct = (function (t) {
  "use strict";

  var socket = t.socket.extend({
    url: function() {
      return t.acct.current && t.acct.current.socketUrl();
    }
  });

  t.socket.extend(socket);

  var handle = function(e) {
    if(!e.iv) {
      return;
    } else if(e.iv == 'removed') {
        socket.emit('removed');
      // log out
    } else if(e.iv != t.acct.current.iv) {
      t.acct.current.refresh(e.iv).then(function(new_acct) {
        t.acct.current = new_acct;
        socket.emit('updated');
      });
    } else {
      socket.emit('checked');
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
