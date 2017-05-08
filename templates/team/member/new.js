function(t){
  "use strict";

  t.editing(true);

  var form = new t.form(document.member_new);
  form.member_email.focus();
  form.addEventListener("submit", function(e) {
    if(!t.team.current.isAdmin()) {
      form.error.msg("Not allowed", "Only Admins may invite new members.");
      return;
    }
    form.disable();
    var data = form.values(['member_email', 'name', 'include_team_name', 'include_sender_details']);
    t.model.member.invite(data).then(function(member){
      t.view.updateSideNav();
      t.gotoUrl('/'+t.team.current.id+'/members');
    }).catch(function(xhr){
      console.log(xhr);
      form.enable();
      form.error.msg("Member could not be saved", "Please try again");
    });
  });

}
