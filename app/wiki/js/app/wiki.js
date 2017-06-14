Teambo.apps.push((function(t){
  "use strict";

  var app = {
    name: 'wiki',
    label: 'Wiki'
  };

  t.event.on('app-init', function() {
    t.router.addRoutes({
      '/:team_id/wiki'                 : 'app/wiki/index',
      '/:team_id/wiki/new'             : 'app/wiki/new',
      '/:team_id/wiki/:wiki_id/new'    : 'app/wiki/new',
      '/:team_id/wiki/:wiki_id'        : 'app/wiki/view',
      '/:team_id/wiki/:wiki_id/remove' : 'app/wiki/remove',
      '/:team_id/wiki/:wiki_id/edit'   : 'app/wiki/edit',
    });
  });

  app.leftnav = function(){
    return function(text, render) {
      return render("{{>app/wiki/_left}}");
    };
  };

  app.searchResult = function(){
    return function(text, render) {
      return render("{{>app/wiki/_search-result}}");
    };
  };

  t.view.obj.ui.left_toggle.wiki = true;

  return app;

})(Teambo));
