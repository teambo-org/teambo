Teambo.model.member = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.extend(this, {
      url: function() {
        return '/'+t.team.current.id+'/member/'+self.id;
      },
      icon: function() {
        return self.opts.icon ? self.opts.icon : 'icon-user-1';
      },
      active: function() {
        return ((model.current && model.current.id == self.id)
            || (t.model.item.current && t.model.item.current.opts.member_id == self.id)) ? 'active' : '';
      },
      editable: function() {
        return self.isMe();
      },
      isMe: function() {
        return self.id == t.acct.current.member().id;
      }
    });
  };

  model.type = 'member';

  model.schema = new t.schema({
    invite_key:  { type: 'string', required: false, maxLength: 16,  editable: false },
    pubKey:      { type: 'string', required: false, maxLength: 512, editable: false },
    email:       { type: 'string', required: true,  maxLength: 256, editable: false },
    name:        { type: 'string', required: false, maxLength: 256 },
    description: { type: 'string', required: false, maxLength: 2048 },
    icon:        { type: 'string', required: false, maxLength: 32 }
  });

  t.model.extend(model);

  model.getActiveId = function() {
    return model.current ? model.current.id : (t.model.item.current ? t.model.item.current.opts.member_id : null);
  };

  model.invite = function(data) {
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
      t.xhr.post('/member/invite', {
        data: xhrdata
      }).then(function (xhr) {
        var d = JSON.parse(xhr.responseText);
        if(xhr.status == 201) {
          model.create({
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

  t.event.on('team-post-init', function(team) {
    return t.acct.current.createMember();
  });

  return model;

})(Teambo);
