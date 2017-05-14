function(t){
  "use strict";

  if(!t.acct.current.rsa) {
    t.app.gotoUrl('/keygen');
    return;
  }

  var sockets = [];

  t.event.once('pre-nav', function() {
    t.socket.acct.stop();
    t.socket.inviteAcceptance.stop();
    sockets.forEach(function(socket) {
      socket.stop();
    });
  });

  var el = document.getElementById('teams');
  var renderTeams = function(teams, orig_html) {
    t.team.reset();
    logo.classList.remove('spinner');
    var html = '';
    teams.forEach(function(team) {
      html += t.view.renderTemplate('external/_team-li', team);
    });
    t.acct.current.invites.forEach(function(invite) {
      html += t.view.renderTemplate('external/_invite-li', {invite: invite});
    });
    el.innerHTML = orig_html + html;
    var theme_styles = t.view.renderTemplate('external/account-themes', {teams: teams, default_theme: t.themes["Default"]}),
      url = sjcl.codec.base64.fromBits(sjcl.codec.utf8String.toBits(theme_styles));
    document.getElementById('account-themes').href = "data:text/css;base64,"+url;

    var anchors = el.querySelectorAll('a');
    var disabled = false;
    [].forEach.call(anchors, function(el) {
      el.addEventListener('click', function(e) {
        if(disabled) {
          e.preventDefault();
        }
        disabled = true;
      });
    });
    var i = 0;
    if(anchors.length) {
      anchors[0].focus();
    }
    document.getElementById('team-new').style.display = "block";

    t.socket.acct.start();

    t.team.summaries = {};
    teams.forEach(function(team) {
      var el = document.getElementById('team-li-'+team.id);
      var timeout;
      var socket = new t.socket.teamSummary(team);
      var n = t.team.summaries[team.id] ? t.team.summaries[team.id].logs : 0;
      var update_el = function() {
        if(!el) return;
        t.team.summaries[team.id] = {"logs": n};
        el.innerHTML = t.view.renderTemplate('external/_team-li', team);
      };
      socket.on('message', function(e) {
        if(e.type == "log") {
          if(e.ts > team.last_seen) {
            n++;
            clearTimeout(timeout);
            timeout = setTimeout(update_el, 100);
          }
        }
      });
      socket.start();
      sockets.push(socket);
    });
  };

  var findTeams = function() {
    // return;
    t.team.findAll().then(function(teams) {
      var orig_html = '';
      var welcome_el = document.getElementById('welcome');
      if(welcome_el) {
        var orig_html = el.innerHTML;
      }
      if(teams.length) {
        logo.classList.add('spinner');
        var p = [];
        teams.forEach(function(team) {
          p.push(team.isCached());
          // p.push(team.getSummary());
          p.push(team.queue.init());
        });
        Promise.all(p).then(function() {
          renderTeams(teams, orig_html);
        }).catch(function() {
          var p = [];
          teams.forEach(function(team) {
            p.push(team.init);
          });
          t.promise.serial(p).then(function() {
            teams.forEach(function(team) {
              if(!team.last_seen) {
                team.lastSeen(t.time());
              }
            });
            renderTeams(teams, orig_html);
          }).catch(function(e) {
            renderTeams(teams, orig_html);
          });
        });
      } else {
        renderTeams(teams, orig_html);
      }
    });
  };

  localforage.getItem('ikey-data').then(function(d) {
    if(d && d.ikey) {
      t.app.gotoUrl('/invite');
    } else {
      findTeams();
    }
  });

  t.view.updateStatus();

}
