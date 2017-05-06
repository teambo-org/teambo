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
        return 'icon-user-1';
      },
      active: function() {
        return ((model.current && model.current.id == self.id)
            || (t.model.item.current && t.model.item.current.opts.member_id == self.id)) ? 'active' : '';
      }
    });
  };

  model.type = 'member';

  model.schema = new t.schema({
    pubKey:      { type: 'string', required: true,  maxLength: 512, editable: false },
    email:       { type: 'string', required: true,  maxLength: 256, editable: false },
    name:        { type: 'string', required: true,  maxLength: 256 },
    description: { type: 'string', required: false, maxLength: 2048 },
    icon:        { type: 'string', required: false, maxLength: 65535 }
  });

  t.model.extend(model);

  t.event.on('team-post-init', function(team) {
    return t.acct.current.createMember();
  });

  return model;

})(Teambo);
