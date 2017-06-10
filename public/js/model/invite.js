Teambo.model.invite = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.object.extend(this, data);
    t.object.extend(this, {
      ikey: data.ikey,
      name: data.name,
      pubKey: data.pubKey || null
    });
  };

  model.create = function(data) {
    if(!data || !data.member_email) {
      return Promise.reject();
    }
    return new Promise(function (fulfill, reject) {
      // 3 XHR requests to invite a member? One would be better
      t.model.member.create({
        email: data.member_email,
        name:  data.name
      }).then(function(m) {
        var xhrdata = {
          email:   data.member_email
        };
        if(data.include_team_name) {
          xhrdata.team_name = t.team.current.opts.name;
        }
        if(data.include_sender_details) {
          var member = t.acct.current.member();
          xhrdata.sender_email = member.opts.email;
          xhrdata.sender_name  = member.opts.name;
        }
        t.xhr.post('/invite', {
          data: xhrdata
        }).then(function (xhr) {
          var d = JSON.parse(xhr.responseText);
          if(xhr.status == 201) {
            m.update({
              invite_key: d.ikey
            }).then(function(m) {
              fulfill(m);
            });
          } else {
            reject(xhr);
          }
        });
      }).catch(reject);
    });
  };

  model.respond = function(data) {
    if(!data || !data.chk || !data.ikey) {
      return Promise.reject();
    }
    return new Promise(function (fulfill, reject) {
      var email = t.acct.current.email;
      var xhrdata = {
        ikey:   data.ikey,
        hash:   t.crypto.sha(data.ikey+data.chk+email),
        pubKey: t.acct.current.rsa.pubTPO().n
      };
      t.xhr.post('/invite/response', {
        data: xhrdata
      }).then(function (xhr) {
        if(xhr.status == 201) {
          fulfill(xhr);
        } else {
          reject(xhr);
        }
      });
    });
  };

  model.accept = function(member, pubKey) {
    if(!member || !pubKey) {
      return Promise.reject();
    }
    return new Promise(function (fulfill, reject) {
      var email = member.opts.email;
      member.grantAccess(t.team.current, 'key').then(function(mkey) {
        var xhrdata = {
          ikey:      member.opts.invite_key,
          ct:        t.team.current.rsaTPO(pubKey, [member.id, mkey])
        };
        t.xhr.post('/invite/acceptance', {
          data: xhrdata,
          team: t.team.current
        }).then(function (xhr) {
          if(xhr.status == 201) {
            member.opts.pubKey = pubKey;
            delete(member.opts['invite_key']);
            member.save().then(function(member){
              fulfill(member);
            });
          } else {
            reject(xhr);
          }
        });
      }).catch(reject);
    });
  };

  model.activate = function(ikey, ct) {
    var data = t.acct.current.rsa.decrypt(t.crypto.b64tohex(ct));
    if(data) {
      var parts = data.split('-');
      var team_data = {
        id: parts[0],
        key: parts[1],
        member_id: parts[2],
        mkey: parts[3],
      };
      t.array.deleteByProperty(t.acct.current.teams, 'id', team_data.id);
      t.array.deleteByProperty(t.acct.current.invites, 'ikey', ikey);
      return t.acct.current.addTeam(team_data);
    } else {
      var invite = t.array.findByProperty(t.acct.current.invites, 'ikey', ikey);
      if(invite) {
        invite.failed = true;
      }
      return Promise.reject();
    }
  };

  return model;

})(Teambo);
