Teambo.model.invite = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.extend(this, data);
    t.extend(this, {
      ikey: data.ikey
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

  return model;

})(Teambo);
