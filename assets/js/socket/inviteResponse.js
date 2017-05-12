Teambo.socket.inviteResponse = (function (t) {
  "use strict";

  var socket = t.socket.extend({
    url: function() {
      var team = t.team.current;
      if(!team) {
        return
      }
      var ikeys = get_invite_keys();
      if(!ikeys) {
        socket.stop();
        return;
      }
      return "/invite/response?ikey="+ikeys
    }
  });

  var get_invite_keys = function() {
    var invite_keys = [];
    t.model.member.all.forEach(function(m){
      if(m.opts.invite_key) {
        invite_keys.push(m.opts.invite_key);
      }
    });
    return invite_keys.join(',');
  };

  var handle = function(e) {
    if(!e.pubKey) {
      return;
    } else if(e.pubKey == 'expired') {
      // Remove member
    } else {
      var member;
      t.model.member.all.forEach(function(m){
        if(m.opts.invite_key == e.ikey) {
          member = m;
        }
      });
      if(member) {
        t.model.invite.accept(member, e.pubKey);
      }
    }
    // Stop socket if no more pending invites
  };

  socket.on('message', function(evt) {
    var parts = evt.data.split('-');
    var e = {
      ikey   : parts[0],
      pubKey : parts[1]
    };
    handle(e);
  });

  return socket;

})(Teambo);