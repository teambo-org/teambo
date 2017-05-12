Teambo.model.invite = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.extend(this, data);
    t.extend(this, {
      ikey: data.ikey,
      name: data.name,
      pubKey: data.pubKey || null
    });
  };

  model.create = function(data) {
    if(!data || !data.member_email) {
      return Promise.reject();
    }
    return t.promise(function (fulfill, reject) {
      var xhrdata = {
        team_id: t.team.current.id,
        mkey:    t.team.current.mkey,
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
          t.model.member.create({
            email: data.member_email,
            name:  data.name,
            invite_key: d.ikey
          }).then(function(m) {
            fulfill(m);
          }).catch(reject);
        } else {
          reject(xhr);
        }
      });
    });
  };

  model.respond = function(data) {
    if(!data || !data.chk || !data.ikey) {
      return Promise.reject();
    }
    return t.promise(function (fulfill, reject) {
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
    return t.promise(function (fulfill, reject) {
      var email = member.opts.email;
      var xhrdata = {
        team_id:   t.team.current.id,
        mkey:      t.team.current.mkey,
        member_id: member.id,
        ikey:      member.opts.invite_key,
        ct:        t.team.current.rsaTPO(pubKey)
      };
      t.xhr.post('/invite/acceptance', {
        data: xhrdata
      }).then(function (xhr) {
        if(xhr.status == 201) {
          member.opts.pubKey = pubKey;
          delete(member.opts['invite_key']);
          member.save().then(function(){
            fulfill(xhr);
          });
        } else {
          reject(xhr);
        }
      });
    });
  };

  model.activate = function(ikey, ct, mkey) {
    var data = t.acct.current.rsa.decrypt(t.crypto.b64tohex(ct));
    if(data) {
      var parts = data.split('-');
      t.acct.current.teams.push({
        id: parts[0],
        mkey: mkey,
        key: parts[1]
      });
    }
    t.deleteByProperty(t.acct.current.invites, 'ikey', ikey);
    return t.acct.current.save();
  };

  return model;

})(Teambo);