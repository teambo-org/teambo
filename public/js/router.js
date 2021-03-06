Teambo.router = (function(t){
  "use strict";

  var routes = [];
  var plain_routes = {
    '' : 'external/index',
    '/invite'       : 'external/invite/view',
    '/account'      : 'external/account/index',
    '/verification' : 'external/verification/view',
    '/:team_id'                            : 'team/dashboard',
    '/:team_id/outbox'                     : 'team/outbox',
    '/:team_id/search'                     : 'team/search/index',
    '/:team_id/edit'                       : 'team/settings/edit',
    '/:team_id/remove'                     : 'team/settings/remove',
    '/:team_id/new'                        : 'team/folder/new',
    '/:team_id/plan'                       : 'team/plan/index',
    '/:team_id/plan/new'                   : 'team/plan/new',
    '/:team_id/plan/:plan_id'              : 'team/plan/view',
    '/:team_id/plan/:plan_id/remove'       : 'team/plan/remove',
    '/:team_id/plan/:plan_id/edit'         : 'team/plan/edit',
    '/:team_id/plan/:plan_id/new'                  : 'team/item/new',
    '/:team_id/plan/:plan_id/item/:item_id'        : 'team/item/view',
    '/:team_id/plan/:plan_id/item/:item_id/edit'   : 'team/item/edit',
    '/:team_id/plan/:plan_id/item/:item_id/remove' : 'team/item/remove',
    '/:team_id/plan/:plan_id/item/:item_id/comment/:comment_id/edit'   : 'team/comment/edit',
    '/:team_id/plan/:plan_id/item/:item_id/comment/:comment_id/remove' : 'team/comment/remove',
    '/:team_id/comment/:comment_id/edit'   : 'team/comment/edit',
    '/:team_id/comment/:comment_id/remove' : 'team/comment/remove',
    '/:team_id/folders'                    : 'team/folder/index',
    '/:team_id/folder/:folder_id'          : 'team/folder/view',
    '/:team_id/folder/:folder_id/remove'   : 'team/folder/remove',
    '/:team_id/folder/:folder_id/edit'     : 'team/folder/edit',
    '/:team_id/folder/:folder_id/new'      : 'team/item/new',
    '/:team_id/item/new'                   : 'team/item/new',
    '/:team_id/item/:item_id'              : 'team/item/view',
    '/:team_id/item/:item_id/edit'         : 'team/item/edit',
    '/:team_id/item/:item_id/remove'       : 'team/item/remove',
    '/:team_id/item/:item_id/comment/:comment_id/edit'   : 'team/comment/edit',
    '/:team_id/item/:item_id/comment/:comment_id/remove' : 'team/comment/remove',
    '/:team_id/members'                    : 'team/member/index',
    '/:team_id/members/new'                : 'team/member/new',
    '/:team_id/member/:member_id'          : 'team/member/view',
    '/:team_id/member/:member_id/edit'     : 'team/member/edit',
    '/:team_id/member/:member_id/remove'   : 'team/member/remove',
    '/:team_id/member/:member_id/leave'    : 'team/member/leave'
  };

  var router = {
    init: function(templates) {
      for(var i in templates) {
        if(i.indexOf('index/') === 0) {
          routes.push({
            route: new RegExp('^'+i.substr(5)+'$'),
            tpl: i,
            vars: []
          });
        } else if(i.indexOf('external/') === 0) {
          routes.push({
            route: new RegExp('^'+i.substr(8)+'$'),
            tpl: i,
            vars: []
          });
        }
      }
      this.addRoutes(plain_routes);
    },
    find: function(url) {
      for (var i in routes) {
        if(routes[i].route.test(url)) {
          var route = routes[i];
          var m = routes[i].route.exec(url);
          route.data = {};
          for(var j in route.vars) {
            route.data[route.vars[j]] = m[parseInt(j)+1];
          }
          return route;
        }
      }
      return;
    },
    findClosest: function(url) {
      var route = router.find(url);
      while(!route) {
        url = url.split('/').slice(0,-1).join('/');
        route = router.find(url);
      }
      return route;
    },
    addRoutes: function(routeArr) {
      for(var url in routeArr) {
        var m = url.match(/\:([a-z_]+)/g);
        m = m ? m : []
        m.forEach(function(v, j) {
          m[j] = m[j].substr(1);
        });
        routes.push({
          route: new RegExp('^'+url.replace(/\:([a-z_]+)/g, '([^/]+)')+'$'),
          tpl: routeArr[url],
          vars: m
        });
      }
    },
    routes: routes
  };

  return router;

})(Teambo);
