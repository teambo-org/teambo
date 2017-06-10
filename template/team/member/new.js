function(t){
  "use strict";

  t.app.editing = true;

  var form = new t.form(document.member_new);
  form.member_email.focus();
  form.addEventListener("submit", function(e) {
    if(!t.team.current.isAdmin()) {
      form.error.msg("Not allowed", "Only Admins may invite new members.");
      return;
    }
    form.disable();
    var data = form.values(['member_email', 'name', 'include_team_name', 'include_sender_details']);
    for(var i in t.model.member.all) {
      var m = t.model.member.all[i];
      if(m.opts.email == data.member_email) {
        form.enable();
        form.error.msg("Member has already been added", "A member with this email address already exists");
        return;
      }
    }
    t.model.invite.create(data).then(function(member){
      t.view.updateSideNav();
      t.socket.inviteResponse.start();
      t.app.gotoUrl('/'+t.team.current.id+'/members');
    }).catch(function(xhr){
      if(xhr.status === 403) {
        var res = JSON.parse(xhr.responseText);
        if(res.code && res.code === 'member_limit') {
          form.error.msg("Member limit reached", "You must remove a member or upgrade your plan in order to invite another member");
        } else {
          form.error.msg("Are you an admin?", "Only a team admin may invite a new member");
        }
      } else {
        form.error.msg("Member could not be saved", "Please try again");
      }
      form.enable();
    });
  });

}
