Teambo.socket.inviteAcceptance = (function (t) {
  "use strict";

  var socket = new t.socket({
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
      var invite = t.array.findByProperty(t.acct.current.invites, 'ikey', e.ikey);
      if(invite && !invite.expired) {
        t.array.deleteByProperty(t.acct.current.invites, 'ikey', e.ikey);
        t.socket.acct.stop();
        t.acct.current.save().then(function() {
          t.app.refresh();
        }).catch(function() {
          t.app.refresh();
        });
      }
    } else {
      var invite = t.array.findByProperty(t.acct.current.invites, 'ikey', e.ikey);
      if(invite && !invite.failed) {
        t.socket.acct.stop();
        t.model.invite.activate(e.ikey, e.ct, e.mkey).then(function() {
          t.app.refresh();
        }).catch(function() {
          t.app.refresh();
        });
      }
    }
    // Stop socket if no more pending invites
  };

  socket.on('message', function(e) {
    e.ikey = e.channel_id;
    handle(e);
  });

  return socket;

})(Teambo);
