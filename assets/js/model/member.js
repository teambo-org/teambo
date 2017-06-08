Teambo.model.member = (function(t){
  "use strict";

  var model = function(data) {
    var self = this;
    t.model.apply(this, [data, model]);
    t.object.extend(this, {
      item_collection: function() {
        return t.model.item.collect_all().filter_member(this);
      },
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
        return self.isMe() || t.team.current.isAdmin();
      },
      isMe: function() {
        return self.id == t.acct.current.member().id;
      },
      canLeave: function() {
        return self.isMe() && !t.team.current.isAdmin();
      },
      canRemove: function() {
        return !self.isMe() && t.team.current.isAdmin();
      },
      grantAccess: function(team, type) {
        return new Promise(function(fulfill, reject){
          t.xhr.post('/team/member/access', {
            data: {
              id: self.id,
              type: type
            },
            team: team
          }).then(function(xhr) {
            var data = JSON.parse(xhr.responseText);
            fulfill(data.mkey);
          }).catch(reject);
        });
      },
      context_member: true
    });
    if(self.opts && !self.opts.name) {
      self.opts.name = self.opts.email;
    }
  };

  model.type = 'member';

  model.schema = new t.schema({
    invite_key:  { type: 'string', required: false, maxLength: 16 },
    pubKey:      { type: 'string', required: false, maxLength: 512, editable: false },
    email:       { type: 'string', required: true,  maxLength: 256, editable: false, searchable: true },
    name:        { type: 'string', required: false, maxLength: 256 , searchable: true},
    description: { type: 'text',   required: false, maxLength: 2048, searchable: true },
    icon:        { type: 'string', required: false, maxLength: 32 }
  });

  t.model._extend(model);

  model.track_history = false;

  model.getActiveId = function() {
    return model.current ? model.current.id : (t.model.item.current ? t.model.item.current.opts.member_id : null);
  };

  model.collection = function(models) {
    t.model.collection.apply(this, [models]);
    t.object.extend(this, {
      filter_active: function() {
        return this.filter(function(member) {
          return !!member.opts.pubKey;
        });
      },
      filter_inactive: function() {
        return this.filter(function(member) {
          return !member.opts.pubKey;
        });
      },
      filter: function(fn) {
        return new model.collection(this.models.filter(fn));
      }
    });
  };

  return model;

})(Teambo);
