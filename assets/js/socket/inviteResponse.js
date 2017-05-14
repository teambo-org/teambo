Teambo.socket.inviteResponse = (function (t) {
  "use strict";

  var socket = new t.socket({
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
      var member;
      t.model.member.all.forEach(function(m){
        if(m.opts.invite_key == e.ikey) {
          member = m;
        }
      });
      if(member) {
        member.update({invite_key: ''});
        t.view.emit('member-updated', {id: member.id, iv: member.iv, member: member});
      }
      // Mark member invite expired
    } else {
      var member;
      t.model.member.all.forEach(function(m){
        if(m.opts.invite_key == e.ikey) {
          member = m;
        }
      });
      if(member) {
        t.model.invite.accept(member, e.pubKey);
        t.view.emit('member-updated', {id: member.id, iv: member.iv, member: member});
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
