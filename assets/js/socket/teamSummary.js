Teambo.socket.teamSummary = (function (t) {
  "use strict";

  var socket = function(team) {
    t.socket.apply(this, []);
    t.object.extend(this, {
      url: function() {
        if(!team) {
          return
        }
        return team.signSocketUrl("/team/socket?ts="+team.lastSeen());
      }
    });
  };

  return socket;

})(Teambo);
