Teambo.socket.inviteAcceptance = (function (t) {
  "use strict";

  var socket = t.socket.extend({
    url: function() {
      var ikeys = get_invite_keys();
      if(!ikeys) {
        socket.stop();
        return;
      }
      return "/invite/acceptance?ikey="+ikeys
    }
  });

  var get_invite_keys = function() {
    var invite_keys = [];
    t.acct.current.invites.forEach(function(invite){
      if(invite.ikey) {
        invite_keys.push(invite.ikey);
      }
    });
    return invite_keys.join(',');
  };

  var handle = function(e) {
    if(!e.ct) {
      return;
    } else if(e.ct == 'expired') {
      t.deleteByProperty(t.acct.current.invites, 'ikey', e.ikey);
      t.acct.current.save().then(function() {
        t.refresh();
      });
    } else {
      var invite = t.findByProperty(t.acct.current.invites, 'ikey', e.ikey);
      if(invite) {
        t.model.invite.activate(e.ikey, e.ct, e.mkey).then(function() {
          t.refresh();
        });
      }
    }
    // Stop socket if no more pending invites
  };

  socket.on('message', function(evt) {
    var parts = evt.data.split('-');
    var e = {
      ikey : parts[0],
      ct   : parts[1],
      mkey : parts[2]
    };
    handle(e);
  });

  return socket;

})(Teambo);
