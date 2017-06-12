Teambo.apps.push((function(t){
  "use strict";

  var app = {
    name: 'wiki',
    label: 'Wiki'
  };

  t.event.on('app-init', function() {
    t.router.addRoutes({
      '/:team_id/wiki'                 : 'team/wiki/index',
      '/:team_id/wiki/new'             : 'team/wiki/new',
      '/:team_id/wiki/:wiki_id/new'    : 'team/wiki/new',
      '/:team_id/wiki/:wiki_id'        : 'team/wiki/view',
      '/:team_id/wiki/:wiki_id/remove' : 'team/wiki/remove',
      '/:team_id/wiki/:wiki_id/edit'   : 'team/wiki/edit',
    });
  });

  app.leftnav = function(){
    return t.view.renderTemplate('team/wiki/_left', {});
  };

  return app;

})(Teambo));
